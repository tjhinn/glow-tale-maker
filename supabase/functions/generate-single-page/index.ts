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
          pages,
          illustration_style,
          hero_gender
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

    // Build comprehensive character replacement prompt
    const illustrationStyle = story.illustration_style || 'whimsical storybook';
    
    let promptText = `Edit this storybook page to create a personalized version:

**IMAGES PROVIDED:**
- IMAGE 1 (Template Page): The original storybook page with a generic child character
- IMAGE 2 (Personalized Cover): Shows EXACTLY what the personalized hero and companion look like

**YOUR TASK:**
Replace the generic hero in the template page with the personalized hero shown in the cover image.

**CRITICAL - ILLUSTRATION STYLE (${illustrationStyle}):**
- Match the EXACT art style of the template page
- The character must look native to the illustration, not pasted in
- Match: brush strokes, shading, texture, line quality, lighting
- Blend seamlessly with the existing artwork

**CHARACTER REPLACEMENT:**
- Find the generic child character in the template page
- Replace them with ${personalization.heroName} (a ${personalization.gender})
- The replacement character MUST have the same identity as Image 2:
  - Same face structure, hair color, hairstyle, skin tone
  - Same ${personalization.favoriteColor || 'colorful'}-themed costume
  - Same body type and proportions for a ${personalization.gender}
- Keep the character in approximately the same LOCATION in the scene

**EXPRESSION & POSE VARIETY (IMPORTANT):**
- Give ${personalization.heroName} a NATURAL, CONTEXTUALLY APPROPRIATE facial expression for this scene
- Vary the expression based on the story moment: curious, happy, surprised, determined, thoughtful, excited, peaceful, etc.
- Allow natural body pose variation - the character can have different arm positions, head tilts, and gestures
- The pose should feel dynamic and alive, not stiff or identical to other pages
- Match the body language to the emotional tone of the scene
- DO NOT copy the exact same expression/pose from the cover or other pages

**EMOTIONAL CONTEXT FOR THIS PAGE:**
- This is page ${pageNumber} of the story
- Interpret the scene and choose an expression that matches the narrative moment
- Examples: discovering something new = curious/excited; overcoming a challenge = determined/proud; peaceful ending = serene/happy
`;

    // Add pet replacement instructions if applicable
    if (personalization.petName && personalization.petType) {
      promptText += `
**PET COMPANION REPLACEMENT:**
- Replace any existing companion animal with ${personalization.petName} the ${personalization.petType}
- The pet must match exactly how it appears in Image 2
- Keep the same relative position to the hero
- Match the illustration style perfectly
`;
    }

    // Add color accent instructions
    if (personalization.favoriteColor) {
      promptText += `
**COLOR ACCENTS:**
- Add subtle ${personalization.favoriteColor} accents where appropriate
- The hero's costume should feature ${personalization.favoriteColor} prominently (as shown in Image 2)
`;
    }

    promptText += `
**WHAT TO PRESERVE (DO NOT CHANGE):**
- Background and environment: Keep exactly as is
- Scene composition and layout: Maintain completely
- Lighting and atmosphere: Preserve
- All other elements besides the hero and pet: Leave untouched
- Any text or story elements: Preserve

**OUTPUT REQUIREMENTS:**
- Same aspect ratio as the input template page
- No text overlays or labels
- Professional children's book quality
- The personalized characters should look like they were always part of this scene
`;

    console.log(`[${orderId}] Compositing page ${pageNumber} with AI...`);
    console.log(`[${orderId}] Illustration style: ${illustrationStyle}`);
    
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
                text: promptText,
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
      .from("order-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload page image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('order-images')
      .getPublicUrl(fileName);

    // Use atomic update to prevent race conditions
    const personalizedText = personalizeText(pageData.text, personalization);
    
    const { error: updateError } = await supabase.rpc('update_generated_page', {
      p_order_id: orderId,
      p_page_number: pageNumber,
      p_image_url: publicUrlData.publicUrl,
      p_status: 'pending_review',
      p_generated_at: new Date().toISOString(),
      p_text: personalizedText,
    });

    if (updateError) {
      throw new Error(`Failed to update page: ${updateError.message}`);
    }

    // Determine new status based on progress
    const { data: updatedOrder } = await supabase
      .from("orders")
      .select("generated_pages")
      .eq("id", orderId)
      .single();

    const totalPages = storyPages.length;
    const generatedCount = (updatedOrder?.generated_pages as any[])?.length || 0;
    let newStatus = order.status;
    
    if (generatedCount === totalPages) {
      newStatus = "pages_ready_for_review";
    } else if (generatedCount > 0) {
      newStatus = "pages_in_progress";
    }

    // Update status if changed
    if (newStatus !== order.status) {
      await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);
    }

    console.log(`[${orderId}] ✅ Page ${pageNumber} generated successfully (${generatedCount}/${totalPages})`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        pageNumber,
        imageUrl: publicUrlData.publicUrl,
        text: personalizedText,
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