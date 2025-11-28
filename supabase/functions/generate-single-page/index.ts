import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Personalize text by replacing placeholders
function personalizeText(template: string, personalization: any): string {
  return template
    .replace(/{heroName}/g, personalization.heroName)
    .replace(/{petName}/g, personalization.petName)
    .replace(/{petType}/g, personalization.petType)
    .replace(/{city}/g, personalization.city)
    .replace(/{favoriteColor}/g, personalization.favoriteColor || '')
    .replace(/{favoriteFood}/g, personalization.favoriteFood || '');
}

// Chunked base64 encoding to prevent stack overflow on large images
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, pageNumber } = await req.json();
    
    if (!orderId || !pageNumber) {
      return new Response(
        JSON.stringify({ error: "orderId and pageNumber are required" }),
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

    console.log(`[${orderId}] Generating page ${pageNumber}...`);

    // Fetch order and story data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        stories (
          title,
          pages
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const personalization = order.personalization_data as any;
    const personalizedCoverUrl = order.personalized_cover_url;
    
    if (!personalizedCoverUrl) {
      throw new Error(`No personalized cover found for order ${orderId}. Please generate the cover first.`);
    }

    const story = (order as any).stories;
    const storyPages = story.pages as any[];
    
    // Find the specific page
    const pageData = storyPages.find((p: any) => p.page === pageNumber);
    if (!pageData) {
      throw new Error(`Page ${pageNumber} not found in story`);
    }

    // Get the template image URL
    let templateUrl = pageData.template_image_url;
    if (!templateUrl) {
      templateUrl = `${order.story_id}/page-${String(pageNumber).padStart(2, '0')}.jpg`;
    }

    const { data: templateData } = supabase.storage.from('story-images').getPublicUrl(templateUrl);

    // Fetch the story image
    const imageResponse = await fetch(templateData.publicUrl);
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = `data:image/jpeg;base64,${arrayBufferToBase64(imageBuffer)}`;

    // Composite hero into the page scene using AI
    console.log(`[${orderId}] Compositing page ${pageNumber} with AI...`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
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
                image_url: { url: personalizedCoverUrl },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${orderId}] AI gateway error:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      if (response.status === 429) {
        throw new Error("AI rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("AI credits depleted. Please add funds to your Lovable workspace.");
      }
      throw new Error(`AI failed for page ${pageNumber}: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const compositeImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!compositeImageUrl) {
      throw new Error(`No composited image generated for page ${pageNumber}`);
    }

    // Upload the composited image to storage
    const base64Data = compositeImageUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    
    const fileName = `${orderId}/page-${pageNumber}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload page image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    // Update generated_pages array in the order
    const generatedPages = (order.generated_pages as any[]) || [];
    const existingPageIndex = generatedPages.findIndex((p: any) => p.page === pageNumber);
    
    const pageUpdate = {
      page: pageNumber,
      image_url: publicUrlData.publicUrl,
      status: "pending_review",
      generated_at: new Date().toISOString(),
      text: personalizeText(pageData.text, personalization),
    };

    if (existingPageIndex >= 0) {
      generatedPages[existingPageIndex] = pageUpdate;
    } else {
      generatedPages.push(pageUpdate);
    }

    // Sort by page number
    generatedPages.sort((a: any, b: any) => a.page - b.page);

    // Determine new status
    const totalPages = storyPages.length;
    const generatedCount = generatedPages.length;
    let newStatus = order.status;
    
    if (generatedCount === totalPages) {
      newStatus = "pages_ready_for_review";
    } else if (generatedCount > 0) {
      newStatus = "pages_in_progress";
    }

    // Update order
    await supabase
      .from("orders")
      .update({
        generated_pages: generatedPages,
        status: newStatus,
      })
      .eq("id", orderId);

    console.log(`[${orderId}] ✅ Page ${pageNumber} generated successfully (${generatedCount}/${totalPages})`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        pageNumber,
        imageUrl: publicUrlData.publicUrl,
        progress: `${generatedCount}/${totalPages}`,
        status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error in generate-single-page:`, errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});