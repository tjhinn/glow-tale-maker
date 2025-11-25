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

    const { heroPhotoUrl, petType, petName, favoriteColor, favoriteFood, illustrationStyle, storyTitle } = await req.json();
    
    if (!heroPhotoUrl) {
      return new Response(
        JSON.stringify({ error: "heroPhotoUrl is required" }),
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

    console.log(`Generating character illustration for photo: ${heroPhotoUrl.substring(0, 50)}...`);

    // Build personalized prompt with illustration style
    let baseStyle = "whimsical children's storybook illustration with warm, hand-painted digital art style";

    // Override base style if specific illustration style is provided
    if (illustrationStyle) {
      const styleLower = illustrationStyle.toLowerCase();
      
      if (styleLower.includes('ghibli') || styleLower.includes('watercolor')) {
        baseStyle = "Studio Ghibli-inspired watercolor illustration with soft, dreamy brushstrokes, gentle color washes, and an ethereal quality. Use muted pastels and flowing organic shapes typical of Miyazaki films";
      } else if (styleLower.includes('modern') || styleLower.includes('digital')) {
        baseStyle = "modern digital illustration with vibrant colors, clean lines, and contemporary children's book aesthetic. Use bold, saturated colors and crisp vector-like rendering";
      } else if (styleLower.includes('vintage') || styleLower.includes('classic')) {
        baseStyle = "vintage classic storybook illustration with crosshatching, muted earth tones, and nostalgic fairy tale aesthetic reminiscent of 1950s-60s children's books";
      } else if (styleLower.includes('cartoon') || styleLower.includes('playful')) {
        baseStyle = "playful cartoon illustration with exaggerated features, bright primary colors, and energetic linework suitable for young readers";
      } else {
        // Custom style provided - use it directly
        baseStyle = `${illustrationStyle} illustration style for children's storybooks`;
      }
    }

    console.log("Illustration Style:", illustrationStyle || "default");
    console.log("Story Title:", storyTitle || "generic adventure");

    // Create a full scene illustration (not just a portrait)
    let promptText = `Create a ${baseStyle} children's storybook scene illustration.

Main Character:
- Transform this child's photo into an illustrated hero, preserving their likeness, facial features, and hair
- Position as the central focus of the scene
- The character should look friendly, brave, and child-appropriate with gentle features`;
    
    // Add story-themed costume with favorite color
    if (favoriteColor && storyTitle) {
      promptText += `
- Dress them in a ${favoriteColor}-themed adventure costume that fits a "${storyTitle}" story theme
- The costume should be vibrant, eye-catching, and suitable for the story's setting`;
    } else if (favoriteColor) {
      promptText += `
- Dress them in ${favoriteColor}-colored adventure clothing that fits the magical storybook aesthetic`;
    }
    
    // Add pet companion as a sidekick
    if (petType && petName) {
      promptText += `

Companion:
- Include ${petName} the ${petType} as a loyal sidekick standing beside or near the hero
- The ${petType} should look friendly, playful, and magical
- Render in the same artistic style as the main character`;
    }
    
    // Add favorite food as whimsical background element
    if (favoriteFood) {
      promptText += `

Background Elements:
- Add ${favoriteFood} as a whimsical detail somewhere in the scene (floating with sparkles, on a table, glowing magically)
- The element should fit naturally into the fairy tale environment`;
    }
    
    // Add story-specific environment if title is provided
    if (storyTitle) {
      promptText += `
- Create a magical fantasy environment that fits the "${storyTitle}" theme`;
    }
    
    promptText += `

Composition:
- Square or 4:3 landscape format suitable for a book cover
- Warm, magical lighting with a sense of adventure
- Child-friendly, bright, inviting, and full of wonder
- The overall scene should feel like the opening of an exciting storybook adventure

IMPORTANT: Do NOT include any text, words, letters, titles, captions, or typography anywhere in the illustration. The image should be purely visual with no written content whatsoever.`;

    console.log("AI Prompt:", promptText);

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
                text: promptText,
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
      throw new Error("Failed to illustrate character");
    }

    const data = await response.json();
    const illustratedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!illustratedImageUrl) {
      throw new Error("No illustrated image generated");
    }

    console.log("Character illustration generated. Uploading to storage...");

    // Convert base64 to blob and upload to storage
    const base64Data = illustratedImageUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `illustrated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("hero-photos")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload illustrated character: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("hero-photos")
      .getPublicUrl(fileName);

    console.log("✅ Character illustration complete!");

    return new Response(
      JSON.stringify({
        success: true,
        illustratedCharacterUrl: urlData.publicUrl,
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
