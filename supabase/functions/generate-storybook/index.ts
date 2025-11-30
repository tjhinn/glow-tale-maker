import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

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

// Helper function to convert color name to RGB
function colorNameToRgb(colorName: string): { r: number; g: number; b: number } {
  const colorMap: Record<string, { r: number; g: number; b: number }> = {
    red: { r: 0.9, g: 0.2, b: 0.2 },
    blue: { r: 0.2, g: 0.4, b: 0.9 },
    green: { r: 0.2, g: 0.7, b: 0.3 },
    pink: { r: 0.95, g: 0.4, b: 0.6 },
    purple: { r: 0.6, g: 0.3, b: 0.8 },
    orange: { r: 1.0, g: 0.5, b: 0.0 },
    yellow: { r: 0.9, g: 0.7, b: 0.0 },
    brown: { r: 0.6, g: 0.4, b: 0.2 },
    black: { r: 0.2, g: 0.2, b: 0.2 },
    white: { r: 0.95, g: 0.95, b: 0.95 },
    gray: { r: 0.5, g: 0.5, b: 0.5 },
    turquoise: { r: 0.2, g: 0.8, b: 0.7 },
    lime: { r: 0.7, g: 0.9, b: 0.2 },
    magenta: { r: 0.9, g: 0.2, b: 0.7 },
  };
  return colorMap[colorName.toLowerCase()] || { r: 0.5, g: 0.2, b: 0.8 }; // Default: magical purple
}

// Helper function to identify personalized words in text
interface TextSegment {
  text: string;
  isPersonalized: boolean;
}

function parseTextWithPersonalization(
  text: string,
  personalization: any
): TextSegment[] {
  const segments: TextSegment[] = [];
  const personalizedValues = [
    personalization.heroName,
    personalization.petName,
    personalization.petType,
    personalization.city,
    personalization.favoriteColor,
    personalization.favoriteFood,
  ].filter(Boolean);

  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    let foundMatch = false;
    
    // Check if any personalized value starts at current position
    for (const value of personalizedValues) {
      if (text.substring(currentIndex, currentIndex + value.length) === value) {
        // Add personalized segment
        segments.push({ text: value, isPersonalized: true });
        currentIndex += value.length;
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      // Add regular character
      const char = text[currentIndex];
      if (segments.length > 0 && !segments[segments.length - 1].isPersonalized) {
        // Append to previous regular segment
        segments[segments.length - 1].text += char;
      } else {
        // Start new regular segment
        segments.push({ text: char, isPersonalized: false });
      }
      currentIndex++;
    }
  }
  
  return segments;
}

// Text wrapping helper function for PDF text with segment awareness
function wrapText(
  text: string,
  regularFont: any,
  boldFont: any,
  regularSize: number,
  boldSize: number,
  maxWidth: number,
  personalization: any
): string[] {
  const lines: string[] = [];
  const words = text.split(" ");
  let currentLine = "";

  const personalizedValues = [
    personalization.heroName,
    personalization.petName,
    personalization.petType,
    personalization.city,
    personalization.favoriteColor,
    personalization.favoriteFood,
  ].filter(Boolean);

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    // Calculate width considering personalized words use different font/size
    let testWidth = 0;
    const testWords = testLine.split(" ");
    for (let i = 0; i < testWords.length; i++) {
      const w = testWords[i];
      const isPersonalized = personalizedValues.includes(w);
      const font = isPersonalized ? boldFont : regularFont;
      const size = isPersonalized ? boldSize : regularSize;
      testWidth += font.widthOfTextAtSize(w, size);
      if (i < testWords.length - 1) {
        testWidth += regularFont.widthOfTextAtSize(" ", regularSize);
      }
    }

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Chunked base64 encoding to prevent stack overflow on large images
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // Process in 8KB chunks
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

  let orderId: string | null = null; // Store at function scope for error handling

  try {
    const body = await req.json();
    orderId = body.orderId;
    
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

    // Update order status to generating_images and clear previous errors
    console.log(`[${orderId}] Starting storybook generation...`);
    await supabase
      .from("orders")
      .update({ 
        status: "generating_images",
        error_log: null
      })
      .eq("id", orderId);

    // Fetch order and story data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        stories (
          title,
          cover_image_url,
          pages
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const personalization = order.personalization_data as any;
    const heroPhotoUrl = order.hero_photo_url;
    let personalizedCoverUrl = order.personalized_cover_url;
    
    if (!personalization) {
      throw new Error(`No personalization data found for order ${orderId}`);
    }
    
    const story = (order as any).stories;
    const storyPages = story.pages as any[];
    
    console.log(`[${orderId}] Personalization data:`, JSON.stringify(personalization));

    // Step 1: Check if we already have a personalized cover, otherwise create one
    if (personalizedCoverUrl) {
      console.log(`[${orderId}] Using pre-generated personalized cover`);
    } else if (heroPhotoUrl) {
      console.log(`[${orderId}] Step 1: Illustrating hero photo (fallback)...`);
      
      const { data: illustrateData, error: illustrateError } = await supabase.functions.invoke(
        'illustrate-hero-photo',
        {
          body: { orderId, heroPhotoUrl }
        }
      );

      if (illustrateError || !illustrateData?.personalizedCoverUrl) {
        throw new Error(`Failed to generate personalized cover: ${illustrateError?.message || 'No personalized cover returned'}`);
      }

      personalizedCoverUrl = illustrateData.personalizedCoverUrl;
      
      // Update order with personalized cover URL
      await supabase
        .from("orders")
        .update({ personalized_cover_url: personalizedCoverUrl })
        .eq("id", orderId);
    } else {
      throw new Error(`No hero photo or personalized cover found for order ${orderId}`);
    }

    console.log(`[${orderId}] Processing ${storyPages?.length || 0} pages...`);

    // Step 2: Personalize text for all pages
    const personalizedPages = storyPages.map(page => ({
      page: page.page,
      text: personalizeText(page.text, personalization),
      template_image_url: page.template_image_url,
    }));

    // Step 3: Composite hero into story images
    const compositeImages: string[] = [];
    
    // Get story images (cover + pages)
    const storyImages: { url: string; name: string; page: number }[] = [];
    
    if (story.cover_image_url) {
      const { data } = supabase.storage.from('story-images').getPublicUrl(story.cover_image_url);
      storyImages.push({ url: data.publicUrl, name: 'cover', page: 0 });
    }
    
    for (const pageData of personalizedPages) {
      let templateUrl = pageData.template_image_url;
      
      // Fallback to predictable path if template_image_url is empty
      if (!templateUrl) {
        templateUrl = `${order.story_id}/page-${String(pageData.page).padStart(2, '0')}.jpg`;
        console.log(`[${orderId}] Using fallback path for page ${pageData.page}: ${templateUrl}`);
      }
      
      const { data } = supabase.storage.from('story-images').getPublicUrl(templateUrl);
      storyImages.push({ url: data.publicUrl, name: `page-${pageData.page}`, page: pageData.page });
    }

    if (storyImages.length === 0) {
      throw new Error("No story images found - story must have template images");
    }

    // Composite hero into each image
    const personalizedStoryPages: any[] = [];
    
    for (let i = 0; i < storyImages.length; i++) {
      const storyImage = storyImages[i];
      console.log(`[${orderId}] Compositing ${storyImage.name} (${i + 1}/${storyImages.length})...`);

      // Fetch the story image
      const imageResponse = await fetch(storyImage.url);
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const imageBase64 = `data:image/jpeg;base64,${arrayBufferToBase64(imageBuffer)}`;

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
          page: storyImage.name,
          model: "google/gemini-3-pro-image-preview"
        });
        
        if (response.status === 429) {
          throw new Error("AI rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits depleted. Please add funds to your Lovable workspace.");
        }
        throw new Error(`AI failed for ${storyImage.name}: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const compositeImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!compositeImageUrl) {
        throw new Error(`No composited image generated for ${storyImage.name}`);
      }

      compositeImages.push(compositeImageUrl);
      
      // Add to personalized story pages (skip cover)
      if (storyImage.page > 0) {
        const pageIndex = storyImage.page - 1;
        personalizedStoryPages.push({
          page: storyImage.page,
          text: personalizedPages[pageIndex].text,
          composited_image_url: compositeImageUrl,
        });
      }
    }

    console.log(`[${orderId}] All images composited. Saving personalized story...`);

    // Step 4: Save personalized story to database
    const personalizedStory = {
      title: personalizeText(story.title, personalization),
      pages: personalizedStoryPages,
    };

    await supabase
      .from("orders")
      .update({ personalized_story: personalizedStory })
      .eq("id", orderId);

    console.log(`[${orderId}] Personalized story saved. Creating PDF...`);

    // Step 5: Create PDF with composited images and text overlays
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom fonts
    pdfDoc.registerFontkit(fontkit);
    
    // Embed Poppins fonts from Google Fonts CDN
    console.log(`[${orderId}] Fetching Poppins fonts...`);
    const poppinsRegularUrl = 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJM.ttf';
    const poppinsBoldUrl = 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7V1s.ttf';
    
    const [regularFontBytes, boldFontBytes] = await Promise.all([
      fetch(poppinsRegularUrl).then(res => res.arrayBuffer()),
      fetch(poppinsBoldUrl).then(res => res.arrayBuffer()),
    ]);
    
    const regularFont = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    console.log(`[${orderId}] Poppins fonts embedded successfully`);

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

      // Cover page (index 0) - No overlay needed, title already flattened in image
      // Story pages (index 1+) - Add text overlay
      if (i > 0) {
        const pageIndex = i - 1;
        const pageText = personalizedPages[pageIndex]?.text || '';
        
        if (pageText) {
          // Text overlay settings - child-friendly sizing
          const baseFontSize = 24;
          const personalizedFontSize = 28;
          const lineHeight = 36;
          const maxWidth = image.width - 120;
          const textBoxHeight = 220;
          
          // Get favorite color for personalized words
          const favoriteColor = colorNameToRgb(personalization.favoriteColor || 'purple');
          
          // Wrap text with awareness of personalized segments
          const lines = wrapText(
            pageText,
            regularFont,
            boldFont,
            baseFontSize,
            personalizedFontSize,
            maxWidth,
            personalization
          );
          
          // Calculate starting Y position
          const totalTextHeight = lines.length * lineHeight;
          let textY = image.height - 80 - ((textBoxHeight - totalTextHeight) / 2);
          
          // Draw semi-transparent background for text
          page.drawRectangle({
            x: 50,
            y: image.height - 80 - textBoxHeight,
            width: image.width - 100,
            height: textBoxHeight,
            color: rgb(1, 1, 1),
            opacity: 0.90,
          });
          
          // Draw text lines with segment-based styling
          for (const line of lines) {
            const segments = parseTextWithPersonalization(line, personalization);
            
            // Calculate starting X for centered text
            let totalLineWidth = 0;
            for (const segment of segments) {
              const font = segment.isPersonalized ? boldFont : regularFont;
              const size = segment.isPersonalized ? personalizedFontSize : baseFontSize;
              totalLineWidth += font.widthOfTextAtSize(segment.text, size);
            }
            
            let currentX = (image.width - totalLineWidth) / 2;
            
            // Draw each segment with appropriate styling
            for (const segment of segments) {
              const font = segment.isPersonalized ? boldFont : regularFont;
              const size = segment.isPersonalized ? personalizedFontSize : baseFontSize;
              const color = segment.isPersonalized 
                ? rgb(favoriteColor.r, favoriteColor.g, favoriteColor.b)
                : rgb(0.15, 0.15, 0.15);
              
              page.drawText(segment.text, {
                x: currentX,
                y: textY,
                size: size,
                font: font,
                color: color,
              });
              
              currentX += font.widthOfTextAtSize(segment.text, size);
            }
            
            textY -= lineHeight;
          }
          
          // Draw page number
          const pageNumText = `${i}`;
          const pageNumWidth = regularFont.widthOfTextAtSize(pageNumText, 12);
          page.drawText(pageNumText, {
            x: (image.width - pageNumWidth) / 2,
            y: 20,
            size: 12,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error in generate-storybook:`, errorMessage);
    
    // orderId is now available from function scope
    if (orderId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get current generation attempts
        const { data: currentOrder } = await supabase
          .from("orders")
          .select("generation_attempts")
          .eq("id", orderId)
          .single();
        
        const attempts = (currentOrder?.generation_attempts || 0) + 1;
        
        await supabase
          .from("orders")
          .update({ 
            status: "payment_received",
            error_log: errorMessage,
            generation_attempts: attempts
          })
          .eq("id", orderId);
          
        console.log(`[${orderId}] Error saved to database, status reset to payment_received`);
      } catch (dbError) {
        console.error(`[${orderId}] Failed to save error to database:`, dbError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});