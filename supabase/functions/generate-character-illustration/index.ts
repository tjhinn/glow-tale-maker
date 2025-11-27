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
      illustrationStyle,
      heroGender,
      storyTheme
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
    
    // Debug logging for gender parameter
    console.log("Hero Gender received:", heroGender);
    console.log("Hero Gender type:", typeof heroGender);

    // Create personalized cover prompt with normalized gender
    const normalizedGender = (heroGender || '').toString().toLowerCase().trim();
    console.log("Normalized Gender:", normalizedGender);
    
    const genderLabel = normalizedGender === 'boy' ? 'BOY' : normalizedGender === 'girl' ? 'GIRL' : 'CHILD';
    const genderDescriptor = normalizedGender === 'boy' ? 'male' : normalizedGender === 'girl' ? 'female' : 'gender-neutral';
    console.log("Gender Label:", genderLabel);
    console.log("Gender Descriptor:", genderDescriptor);
    
    let promptText = `Edit this storybook cover to create a personalized version:

OUTPUT FORMAT: Generate the result as a 4:3 LANDSCAPE image (e.g., 1024x768 or similar landscape dimensions). The aspect ratio MUST match the input cover image exactly.

REFERENCE IMAGE: I'm also providing a photo of the child who should become the hero.

**CRITICAL - ILLUSTRATION STYLE (HIGHEST PRIORITY):**
- You MUST match the EXACT illustration style of the original cover image
${illustrationStyle ? `- The style is: "${illustrationStyle}"
- This means: ${baseStyle}` : `- Analyze the original cover and replicate its exact artistic style`}
- If the cover is 3D/Pixar/CGI style, the character MUST be rendered in 3D with volume, depth, and realistic lighting
- If the cover is 2D/watercolor/flat illustration, the character MUST be 2D/watercolor/flat
- DO NOT mix styles - the personalized character must blend seamlessly with the original cover art
- The character should look like they were always part of this illustration, not pasted in
- Match the exact rendering technique: brush strokes, shading method, line quality, texture, lighting model

CRITICAL - Character Gender:
- The hero MUST be a ${genderLabel}
- If the original cover shows a different gender character, COMPLETELY REPLACE them with a ${genderDescriptor} character
- The character's body type, pose, and proportions must match a ${genderLabel}

Main Character Transformation:
- Replace the main character with an illustrated ${genderLabel.toLowerCase()} version based on the reference photo
- Preserve the child's exact likeness: face shape, eyes, hair color, hairstyle, skin tone
- The character body, pose, and clothing should clearly represent a ${genderLabel.toLowerCase()}
- Position them naturally where the original character was
- Dress them in a ${favoriteColor}-themed costume appropriate for a ${genderLabel.toLowerCase()} that fits the story's theme
${storyTheme ? `

STORY THEME (use this to determine the appropriate costume style):
"${storyTheme}"

The costume MUST match this story's theme AND the character's gender (${genderLabel}):
${normalizedGender === 'boy' ? `
BOY COSTUME EXAMPLES by theme:
- Space/star stories = astronaut suit, space explorer jumpsuit, rocket pilot outfit
- Garden/nature stories = woodland adventurer clothes, forest ranger outfit, leaf-patterned tunic
- Library/book stories = young wizard robes, scholar outfit, magical apprentice attire
- Ocean/underwater stories = sailor suit, pirate outfit, maritime explorer clothes
- Adventure stories = explorer vest, adventurer's outfit with utility belt` : 
normalizedGender === 'girl' ? `
GIRL COSTUME EXAMPLES by theme:
- Space/star stories = sparkly astronaut dress, star princess gown, cosmic explorer outfit with tutu elements
- Garden/nature stories = fairy dress, flower princess gown, woodland sprite outfit with petal details
- Library/book stories = enchanted scholar dress, magical bookkeeper outfit, wizard apprentice gown
- Ocean/underwater stories = mermaid-inspired dress, sailor dress, sea princess outfit
- Adventure stories = explorer dress, adventurer's outfit with flowing elements, princess explorer attire` : `
GENDER-NEUTRAL COSTUME EXAMPLES by theme:
- Space/star stories = astronaut suit, space explorer outfit
- Garden/nature stories = woodland clothes, nature-inspired attire
- Library/book stories = scholar robes, magical reading attire
- Ocean/underwater stories = sailor outfit, maritime clothing
- Adventure stories = explorer outfit, adventurer's attire`}

Make sure the costume naturally fits BOTH the story's setting AND looks appropriate for a ${genderLabel.toLowerCase()}` : ''}`;
    
    // Add pet companion instructions
    if (petType && petName) {
      promptText += `

Pet Companion:
- Change any existing companion animal to ${petName} the ${petType}
- Keep the ${petType} in the same artistic style as the rest of the cover
- Position naturally near the hero`;
    }
    
    // Add favorite color accent instructions
    if (favoriteColor) {
      promptText += `

PERSONALIZATION - FAVORITE COLOR ACCENTS (${favoriteColor}):
- Add SUBTLE touches of ${favoriteColor} as accent colors throughout the cover
- These should be small, tasteful additions that don't overwhelm the original color palette
- Examples of where to add ${favoriteColor} accents:
  - Magical sparkles, glows, or light effects can have a ${favoriteColor} tint
  - Small environmental details (flowers, gems, stars, butterflies) can be ${favoriteColor}
  - Subtle highlights on existing objects (book spines, clouds, leaves)
  - Rim lighting or ambient glow effects
  - Accessories or small props near the character
- IMPORTANT: Keep the overall color palette of the original cover intact
- The ${favoriteColor} accents should feel like natural additions, not painted over
- Do NOT recolor major background elements - only add accent touches
- The costume is already ${favoriteColor}-themed, so focus accents on the environment`;
    }
    
    promptText += `

IMPORTANT Guidelines:
- **CRITICAL**: Output the image in EXACTLY 4:3 LANDSCAPE aspect ratio (wider than tall)
- The output dimensions must match the input cover image aspect ratio precisely
- **MOST IMPORTANT**: The illustrated character MUST be in the EXACT SAME art style as the original cover
  - If it's 3D Pixar/CGI style, make a 3D character with proper volume and lighting
  - If it's 2D watercolor, make a 2D watercolor character with soft edges
  - If it's flat digital art, make a flat digital art character
  - The character must look native to the illustration, not like a collage or style mismatch
- Maintain the EXACT same illustration style, lighting, color palette, and rendering technique as the original cover
- Keep the background, environment, and composition intact
- Only modify: the main character and the companion pet
- The result should look like a professionally produced personalized children's book cover
- Do NOT add any text, titles, labels, or captions - leave space at the top for a title overlay
- Do NOT crop or change the aspect ratio of the scene - keep it landscape 4:3`;
    console.log("AI Prompt:", promptText);

    // Call Lovable AI with multi-image input (cover + hero photo)
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
