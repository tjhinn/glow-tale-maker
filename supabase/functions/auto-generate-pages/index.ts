import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

function personalizeText(template: string, personalization: any): string {
  return (template || "")
    .replace(/{heroName}/g, personalization.heroName ?? "")
    .replace(/{petName}/g, personalization.petName ?? "")
    .replace(/{petType}/g, personalization.petType ?? "")
    .replace(/{city}/g, personalization.city ?? "")
    .replace(/{favoriteColor}/g, personalization.favoriteColor ?? "")
    .replace(/{favoriteFood}/g, personalization.favoriteFood ?? "");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

async function generatePage(
  supabase: any,
  lovableApiKey: string,
  order: any,
  story: any,
  pageData: any,
  pageNumber: number,
) {
  const personalization = order.personalization_data;
  const personalizedCoverUrl = order.personalized_cover_url;
  if (!personalizedCoverUrl) {
    throw new Error("No personalized cover available");
  }

  const templateUrl = pageData.template_image_url
    || `${order.story_id}/page-${String(pageNumber).padStart(2, "0")}.jpg`;
  const { data: templateData } = supabase.storage.from("story-images").getPublicUrl(templateUrl);

  const imageResponse = await fetch(templateData.publicUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = `data:image/jpeg;base64,${arrayBufferToBase64(imageBuffer)}`;

  const illustrationStyle = story.illustration_style || "whimsical storybook";
  let promptText = `Edit this storybook page to create a personalized version:

**IMAGES PROVIDED:**
- IMAGE 1 (Template Page): The original storybook page. It MAY or MAY NOT contain a generic child character and/or a companion animal.
- IMAGE 2 (Personalized Cover): Shows EXACTLY what the personalized hero and companion look like

**STEP 1 — DETECT FIRST (CRITICAL):**
Before changing anything, carefully inspect IMAGE 1 and decide:
  (a) Does the template contain a generic child / human character? (yes / no)
  (b) Does the template contain a companion animal? (yes / no)
Some pages are intentionally close-ups of objects, hands, scenery, or environments with NO child and NO animal. That is by design.
**You must NEVER add a child character or an animal that is not already present in the template.** Do not "force" the hero or pet into a scene that doesn't have one.

**STEP 2 — YOUR TASK:**
- If (a) = yes → replace the generic child with the personalized hero from IMAGE 2.
- If (a) = no  → leave the scene exactly as in the template. Do NOT insert the hero anywhere.
- If (b) = yes → replace the existing companion animal with the personalized pet from IMAGE 2.
- If (b) = no  → do NOT add a pet, even if the user provided a pet name/type.
If both (a) and (b) are "no", the output should be visually faithful to the template with no inserted figures (subtle color accents per below are still allowed).

**CRITICAL - ILLUSTRATION STYLE (${illustrationStyle}):**
- Match the EXACT art style of the template page
- The character must look native to the illustration, not pasted in
- Match: brush strokes, shading, texture, line quality, lighting
- Blend seamlessly with the existing artwork

**CHARACTER REPLACEMENT (only if a child character exists in the template):**
- Find the generic child character in the template page
- Replace them with ${personalization.heroName} (a ${personalization.gender})
- The replacement character MUST have the same identity as Image 2:
  - Same face structure, hair color, hairstyle, skin tone
  - Same ${personalization.favoriteColor || "colorful"}-themed costume
  - Same body type and proportions for a ${personalization.gender}
- Keep the character in approximately the same LOCATION in the scene
- If NO child character exists in the template, SKIP this section entirely.

**EXPRESSION & POSE VARIETY (only when a hero is present in the scene):**
- Give ${personalization.heroName} a NATURAL, CONTEXTUALLY APPROPRIATE facial expression for this scene
- Vary the expression based on the story moment
- Allow natural body pose variation
- Match the body language to the emotional tone of the scene
- DO NOT copy the exact same expression/pose from the cover or other pages

**EMOTIONAL CONTEXT FOR THIS PAGE:**
- This is page ${pageNumber} of the story
- Interpret the scene and choose an expression that matches the narrative moment
`;

  if (personalization.petName && personalization.petType) {
    promptText += `
**PET COMPANION REPLACEMENT (only if a companion animal exists in the template):**
- IF the template already shows a companion animal, replace it with ${personalization.petName} the ${personalization.petType}
- The pet must match exactly how it appears in Image 2
- Keep the same relative position to the hero
- Match the illustration style perfectly
- IF the template has no animal, DO NOT add one. Leave the scene as-is.
`;
  }

  if (personalization.favoriteColor) {
    promptText += `
**COLOR ACCENTS:**
- Add subtle ${personalization.favoriteColor} accents where appropriate
- The hero's costume should feature ${personalization.favoriteColor} prominently
`;
  }

  promptText += `
**WHAT TO PRESERVE (DO NOT CHANGE):**
- Background and environment, scene composition, lighting, and any other elements besides hero and pet
- If the template has no child and no animal, the output must remain visually faithful to the template — no inserted figures.

**OUTPUT REQUIREMENTS:**
- Same aspect ratio as the input template page
- No text overlays or labels
- Professional children's book quality
`;

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
            { type: "text", text: promptText },
            { type: "image_url", image_url: { url: imageBase64 } },
            { type: "image_url", image_url: { url: personalizedCoverUrl } },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI gateway failed for page ${pageNumber}: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const compositeImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!compositeImageUrl) {
    throw new Error(`No composited image generated for page ${pageNumber}`);
  }

  const base64Data = compositeImageUrl.split(",")[1];
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const fileName = `${order.id}/page-${pageNumber}-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("order-images")
    .upload(fileName, imageBytes, { contentType: "image/png", upsert: false });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from("order-images").getPublicUrl(fileName);

  const personalizedText = personalizeText(pageData.text, personalization);
  const { error: updateError } = await supabase.rpc("update_generated_page", {
    p_order_id: order.id,
    p_page_number: pageNumber,
    p_image_url: publicUrlData.publicUrl,
    p_status: "pending_review",
    p_generated_at: new Date().toISOString(),
    p_text: personalizedText,
  });
  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);
}

async function runGeneration(orderId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`*, stories ( title, pages, illustration_style, hero_gender )`)
      .eq("id", orderId)
      .single();
    if (orderErr || !order) throw new Error(`Order not found: ${orderErr?.message}`);

    const story = (order as any).stories;
    const storyPages = (story.pages as any[]) || [];
    if (!storyPages.length) throw new Error("Story has no pages");

    await supabase.from("orders").update({ status: "pages_in_progress", error_log: null }).eq("id", orderId);

    for (const pageData of storyPages) {
      const pageNumber = pageData.page;
      console.log(`[auto-gen ${orderId}] page ${pageNumber}/${storyPages.length}`);
      await generatePage(supabase, lovableApiKey, order, story, pageData, pageNumber);
    }

    await supabase.from("orders").update({ status: "pages_ready_for_review" }).eq("id", orderId);
    console.log(`[auto-gen ${orderId}] ✅ complete`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[auto-gen ${orderId}] failed:`, msg);
    await supabase
      .from("orders")
      .update({ status: "payment_received", error_log: `Auto-generation failed: ${msg}` })
      .eq("id", orderId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const providedSecret = req.headers.get("x-internal-secret");
  const expected = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!expected || providedSecret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run in background — return immediately
    // @ts-ignore EdgeRuntime is provided by Supabase
    EdgeRuntime.waitUntil(runGeneration(orderId));

    return new Response(JSON.stringify({ success: true, orderId, started: true }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});