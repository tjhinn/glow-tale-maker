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

// Retry configuration for AI calls
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // Start with 2 seconds

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
    
    let promptText = `Create a personalized storybook cover by editing the provided cover image.

REFERENCE IMAGES: You have the original cover + a photo of the child hero.

STYLE MATCHING:
- Match the exact illustration style of the original cover (${illustrationStyle || 'analyze and replicate the style'})
- Keep the character in the same art style as the background (3D with 3D, 2D with 2D, watercolor with watercolor)

CHARACTER:
- Replace the main character with a ${genderLabel} version based on the child photo
- Preserve face shape, eyes, hair, and skin tone from the photo
- Dress in ${favoriteColor}-themed costume that fits the story${storyTheme ? ': ' + storyTheme : ''}

${petType ? `PET: Replace any companion animal with ${petName} the ${petType} in the same art style` : ''}

${favoriteColor ? `ACCENTS: Add subtle ${favoriteColor} touches (sparkles, small objects, highlights)` : ''}

OUTPUT:
- 4:3 landscape aspect ratio matching the original cover
- No text or titles on the image
- Character blends seamlessly with the original art style`;
    console.log("AI Prompt:", promptText);

    // Call Lovable AI with retry logic
    let personalizedCoverImageUrl: string | undefined;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Calling AI gateway...`);
        
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
            aspectRatio: "4:3",
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
        
        // Log detailed response structure for debugging
        console.log(`[Attempt ${attempt}] AI response structure:`, JSON.stringify({
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length,
          hasMessage: !!data.choices?.[0]?.message,
          hasImages: !!data.choices?.[0]?.message?.images,
          imagesLength: data.choices?.[0]?.message?.images?.length,
          hasContent: !!data.choices?.[0]?.message?.content,
          contentPreview: data.choices?.[0]?.message?.content?.substring(0, 200)
        }));

        personalizedCoverImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (personalizedCoverImageUrl) {
          console.log(`[Attempt ${attempt}] ✅ Image generated successfully!`);
          break; // Success! Exit retry loop
        }

        // Log what we got instead of an image
        if (data.choices?.[0]?.message?.content) {
          console.log(`[Attempt ${attempt}] ⚠️ AI returned text instead of image:`, 
            data.choices[0].message.content.substring(0, 500));
        }

        // If no image and we have retries left, wait and try again
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt; // Exponential backoff
          console.log(`[Attempt ${attempt}] No image in response. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          lastError = new Error("AI returned text response instead of image");
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(`[Attempt ${attempt}] Error:`, lastError.message);
        
        // Don't retry on rate limit or payment errors
        if (lastError.message.includes("rate limit") || lastError.message.includes("credits depleted")) {
          throw lastError;
        }
        
        // If we have retries left, wait and try again
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          console.log(`[Attempt ${attempt}] Error occurred. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!personalizedCoverImageUrl) {
      const errorMessage = `No personalized cover image generated after ${MAX_RETRIES} attempts. ${
        lastError ? `Last error: ${lastError.message}` : 'The AI may have returned text instead of an image.'
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
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
