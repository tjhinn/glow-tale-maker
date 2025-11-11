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
          cover_image_url,
          page_images
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const personalization = order.personalization_data as any;
    const heroPhotoUrl = order.hero_photo_url;
    
    if (!personalization || !heroPhotoUrl) {
      throw new Error(`No personalization data or hero photo found for order ${orderId}`);
    }
    
    const story = (order as any).stories;
    
    console.log(`[${orderId}] Personalization data:`, JSON.stringify(personalization));

    // Step 1: Illustrate the hero photo
    console.log(`[${orderId}] Step 1: Illustrating hero photo...`);
    
    const { data: illustrateData, error: illustrateError } = await supabase.functions.invoke(
      'illustrate-hero-photo',
      {
        body: { orderId, heroPhotoUrl }
      }
    );

    if (illustrateError || !illustrateData?.illustratedHeroUrl) {
      throw new Error(`Failed to illustrate hero: ${illustrateError?.message || 'No illustrated hero returned'}`);
    }

    const illustratedHeroUrl = illustrateData.illustratedHeroUrl;
    
    // Update order with illustrated hero URL
    await supabase
      .from("orders")
      .update({ illustrated_hero_url: illustratedHeroUrl })
      .eq("id", orderId);

    console.log(`[${orderId}] Hero illustrated. Compositing into ${story.page_images?.length || 0} images...`);

    // Step 2: Composite hero into story images
    const compositeImages: string[] = [];
    
    // Get story images (cover + pages)
    const storyImages: { url: string; name: string }[] = [];
    
    if (story.cover_image_url) {
      const { data } = supabase.storage.from('story-images').getPublicUrl(story.cover_image_url);
      storyImages.push({ url: data.publicUrl, name: 'cover' });
    }
    
    if (story.page_images && Array.isArray(story.page_images)) {
      for (const pageImg of story.page_images) {
        const { data } = supabase.storage.from('story-images').getPublicUrl(pageImg.image_url);
        storyImages.push({ url: data.publicUrl, name: `page-${pageImg.page}` });
      }
    }

    if (storyImages.length === 0) {
      throw new Error("No story images found - story must have pre-generated images");
    }

    // Composite hero into each image
    for (let i = 0; i < storyImages.length; i++) {
      const storyImage = storyImages[i];
      console.log(`[${orderId}] Compositing ${storyImage.name} (${i + 1}/${storyImages.length})...`);

      // Fetch the story image
      const imageResponse = await fetch(storyImage.url);
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const imageBase64 = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))}`;

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
              content: [
                {
                  type: "text",
                  text: `Composite this illustrated character into the storybook scene as the main hero. Blend the character naturally into the scene, matching the art style, lighting, and perspective. The character should appear in an appropriate location based on the scene context (foreground if they're the focus, integrated into the action). Maintain the whimsical storybook aesthetic. Hero details: ${personalization.heroName}, ${personalization.gender}.`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
                {
                  type: "image_url",
                  image_url: { url: illustratedHeroUrl },
                },
              ],
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
        console.error(`AI gateway error for ${storyImage.name}:`, response.status, errorText);
        throw new Error(`Failed to composite ${storyImage.name}`);
      }

      const data = await response.json();
      const compositeImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!compositeImageUrl) {
        throw new Error(`No composited image generated for ${storyImage.name}`);
      }

      compositeImages.push(compositeImageUrl);
    }

    console.log(`[${orderId}] All images composited. Creating PDF...`);

    // Step 3: Create PDF with composited images
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < compositeImages.length; i++) {
      const base64Data = compositeImages[i].split(",")[1];
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
