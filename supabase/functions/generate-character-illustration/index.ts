import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple rate limiting using in-memory store
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Filter out old requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in an hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      heroPhotoUrl, 
      coverImageUrl, 
      personalizedTitle, 
      petType, 
      petName, 
      favoriteColor, 
      illustrationStyle 
    } = await req.json();
    
    if (!heroPhotoUrl || !coverImageUrl || !personalizedTitle) {
      return new Response(
        JSON.stringify({ error: "heroPhotoUrl, coverImageUrl, and personalizedTitle are required" }),
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

    console.log(`Generating personalized cover for: ${personalizedTitle}`);

    // Determine illustration style description
    let baseStyle = "whimsical children's storybook illustration with warm, hand-painted digital art style";

    if (illustrationStyle) {
      const styleLower = illustrationStyle.toLowerCase();
      
      if (styleLower.includes('ghibli') || styleLower.includes('watercolor')) {
        baseStyle = "Studio Ghibli-inspired watercolor illustration with soft, dreamy brushstrokes, gentle color washes, and an ethereal quality";
      } else if (styleLower.includes('modern') || styleLower.includes('digital')) {
        baseStyle = "modern digital illustration with vibrant colors, clean lines, and contemporary children's book aesthetic";
      } else if (styleLower.includes('vintage') || styleLower.includes('classic')) {
        baseStyle = "vintage classic storybook illustration with crosshatching, muted earth tones, and nostalgic fairy tale aesthetic";
      } else if (styleLower.includes('cartoon') || styleLower.includes('playful')) {
        baseStyle = "playful cartoon illustration with exaggerated features, bright primary colors, and energetic linework";
      } else {
        baseStyle = `${illustrationStyle} illustration style for children's storybooks`;
      }
    }

    console.log("Illustration Style:", illustrationStyle || "default");
    console.log("Cover Image URL:", coverImageUrl.substring(0, 50) + "...");

    // Create personalized cover prompt
    let promptText = `Edit this storybook cover to create a personalized version:

REFERENCE IMAGE: I'm also providing a photo of the child who should become the hero.

Main Character Transformation:
- Replace the main character in the cover with an illustrated version of the child from the reference photo
- Preserve the child's exact likeness: face shape, eyes, hair color, hairstyle, skin tone
- Position them naturally where the original character was
- Dress them in a ${favoriteColor}-themed costume that matches the scene's style and adventure theme`;
    
    // Add pet companion instructions
    if (petType && petName) {
      promptText += `

Pet Companion:
- Change any existing companion animal to ${petName} the ${petType}
- Keep the ${petType} in the same artistic style as the rest of the cover
- Position naturally near the hero`;
    }
    
    promptText += `

IMPORTANT Guidelines:
- Maintain the EXACT same illustration style, lighting, and color palette as the original cover
- Keep the background, environment, and composition intact
- Only modify: the main character and the companion pet
- The result should look like a professionally produced personalized children's book cover
- Do NOT add any text, titles, labels, or captions - leave space at the top for a title overlay`;

    console.log("AI Prompt:", promptText);

    // Call Lovable AI with multi-image input (cover + hero photo)
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
                text: promptText,
              },
              {
                type: "image_url",
                image_url: { url: coverImageUrl },
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
      throw new Error("Failed to generate personalized cover");
    }

    const data = await response.json();
    const personalizedCoverImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!personalizedCoverImageUrl) {
      throw new Error("No personalized cover image generated");
    }

    console.log("Personalized cover generated. Uploading to storage...");

    // Convert base64 to blob and upload to storage
    const base64Data = personalizedCoverImageUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `personalized-cover-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("hero-photos")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload personalized cover: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("hero-photos")
      .getPublicUrl(fileName);

    console.log("✅ Personalized cover generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        personalizedCoverUrl: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-character-illustration:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});