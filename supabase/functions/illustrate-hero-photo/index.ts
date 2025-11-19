import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, heroPhotoUrl } = await req.json();
    
    if (!orderId || !heroPhotoUrl) {
      return new Response(
        JSON.stringify({ error: "orderId and heroPhotoUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${orderId}] Starting hero photo illustration...`);

    // Call Lovable AI to illustrate the hero photo
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
                text: "Convert this photo into a whimsical children's storybook illustration. Maintain the person's likeness, facial features, and hair, but render in a warm, hand-painted digital art style suitable for a fairy tale. The character should look friendly and child-appropriate with soft colors and gentle features.",
              },
              {
                type: "image_url",
                image_url: { url: heroPhotoUrl },
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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to illustrate hero photo");
    }

    const data = await response.json();
    const illustratedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!illustratedImageUrl) {
      throw new Error("No illustrated image generated");
    }

    console.log(`[${orderId}] Hero illustration generated. Uploading to storage...`);

    // Convert base64 to blob and upload to storage
    const base64Data = illustratedImageUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `${orderId}-illustrated.png`;
    const { error: uploadError } = await supabase.storage
      .from("hero-photos")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload illustrated hero: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("hero-photos")
      .getPublicUrl(fileName);

    console.log(`[${orderId}] ✅ Hero illustration complete!`);

    return new Response(
      JSON.stringify({
        success: true,
        illustratedHeroUrl: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in illustrate-hero-photo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
