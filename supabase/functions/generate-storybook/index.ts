import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

// Text wrapping helper function for PDF text
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

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
                  image_url: { url: personalizedCoverUrl },
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
    const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

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

      // Cover page (index 0) - Add title overlay
      if (i === 0) {
        const title = personalizeText(story.title, personalization);
        const titleSize = 48;
        const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);
        
        page.drawText(title, {
          x: (image.width - titleWidth) / 2,
          y: image.height - 80,
          size: titleSize,
          font: titleFont,
          color: rgb(1, 0.91, 0.5), // Golden #FFE97F
        });
      } 
      // Story pages (index 1-12) - Add text overlay
      else {
        const pageIndex = i - 1;
        const pageText = personalizedPages[pageIndex]?.text || '';
        
        if (pageText) {
          const textBoxHeight = 180;
          const textBoxPadding = 20;
          const fontSize = 16;
          const lineHeight = 22;
          const textBoxX = 40;
          const textBoxY = 40;
          const textBoxWidth = image.width - 80;
          
          // Draw semi-transparent background for text
          page.drawRectangle({
            x: textBoxX,
            y: textBoxY,
            width: textBoxWidth,
            height: textBoxHeight,
            color: rgb(1, 1, 1),
            opacity: 0.85,
          });
          
          // Wrap and draw text
          const wrappedLines = wrapText(pageText, textFont, fontSize, textBoxWidth - 40);
          let textY = textBoxY + textBoxHeight - textBoxPadding - fontSize;
          
          for (const line of wrappedLines) {
            page.drawText(line, {
              x: textBoxX + 20,
              y: textY,
              size: fontSize,
              font: textFont,
              color: rgb(0, 0, 0),
            });
            textY -= lineHeight;
          }
          
          // Draw page number
          const pageNumText = `${i}`;
          const pageNumWidth = textFont.widthOfTextAtSize(pageNumText, 12);
          page.drawText(pageNumText, {
            x: (image.width - pageNumWidth) / 2,
            y: 20,
            size: 12,
            font: textFont,
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
    console.error("Error in generate-storybook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});