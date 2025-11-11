import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update order status to generating_images
    console.log(`[${orderId}] Starting storybook generation...`);
    await supabase
      .from("orders")
      .update({ status: "generating_images" })
      .eq("id", orderId);

    // Fetch order and story data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        stories (
          title,
          image_prompts
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const personalization = order.personalization_data as any;
    
    if (!personalization) {
      throw new Error(`No personalization data found for order ${orderId}`);
    }
    
    const story = (order as any).stories;
    const imagePrompts = story.image_prompts as Array<{ prompt: string; spread: number } | string>;
    
    console.log(`[${orderId}] Personalization data:`, JSON.stringify(personalization));

    console.log(`[${orderId}] Generating ${imagePrompts.length} illustrations...`);

    // Generate illustrations using Lovable AI
    const generatedImages: string[] = [];

    for (let i = 0; i < imagePrompts.length; i++) {
      const imagePromptObj = imagePrompts[i];
      const rawPrompt = typeof imagePromptObj === 'string' ? imagePromptObj : imagePromptObj.prompt;
      
      // Personalize the prompt
      const personalizedPrompt = rawPrompt
        .replace(/{heroName}/g, personalization.heroName || 'the hero')
        .replace(/{petName}/g, personalization.petName || 'the pet')
        .replace(/{petType}/g, personalization.petType || 'pet')
        .replace(/{city}/g, personalization.city || 'the city')
        .replace(/{favoriteColor}/g, personalization.favoriteColor || 'blue')
        .replace(/{favoriteFood}/g, personalization.favoriteFood || 'cookies');

      console.log(`[${orderId}] Generating image ${i + 1}/${imagePrompts.length}...`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Create a children's storybook illustration: ${personalizedPrompt}. Style: warm, whimsical, full-color digital painting.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("AI rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits depleted. Please add funds to your Lovable workspace.");
        }
        const errorText = await response.text();
        console.error(`AI gateway error for image ${i + 1}:`, response.status, errorText);
        throw new Error(`Failed to generate image ${i + 1}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error(`No image generated for prompt ${i + 1}`);
      }

      generatedImages.push(imageUrl);
    }

    console.log(`[${orderId}] All illustrations generated. Creating PDF...`);

    // Create PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < generatedImages.length; i++) {
      const base64Data = generatedImages[i].split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const image = await pdfDoc.embedPng(imageBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const pdfBytes = await pdfDoc.save();

    console.log(`[${orderId}] PDF created. Uploading to storage...`);

    // Upload to storage
    const fileName = `${orderId}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("generated-pdfs")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Generate 7-day signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("generated-pdfs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update order with PDF URL and status
    await supabase
      .from("orders")
      .update({
        status: "pending_admin_review",
        pdf_url: signedUrlData.signedUrl,
        download_expires_at: expiresAt.toISOString(),
      })
      .eq("id", orderId);

    console.log(`[${orderId}] ✅ Storybook generation complete!`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        pdfUrl: signedUrlData.signedUrl,
        expiresAt: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-storybook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
