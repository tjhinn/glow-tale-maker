import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Detect image format from magic bytes
function detectImageFormat(bytes: Uint8Array): 'png' | 'jpg' | 'unknown' {
  // PNG magic bytes: 137 80 78 71 (hex: 89 50 4E 47)
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'png';
  }
  // JPEG magic bytes: 255 216 255 (hex: FF D8 FF)
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'jpg';
  }
  return 'unknown';
}

// Embed image with automatic format detection
async function embedImage(pdfDoc: any, bytes: Uint8Array, logPrefix: string) {
  const format = detectImageFormat(bytes);
  console.log(`${logPrefix} Detected image format: ${format}`);
  
  if (format === 'png') {
    return await pdfDoc.embedPng(bytes);
  } else if (format === 'jpg') {
    return await pdfDoc.embedJpg(bytes);
  } else {
    // Try PNG first, then JPEG as fallback
    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      return await pdfDoc.embedJpg(bytes);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let orderId: string | null = null;

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${orderId}] Starting PDF compilation...`);

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
    const generatedPages = (order.generated_pages as any[]) || [];
    
    if (!personalizedCoverUrl) {
      throw new Error(`No personalized cover found for order ${orderId}`);
    }

    const story = (order as any).stories;
    const storyPages = story.pages as any[];

    // Verify all pages are generated and approved
    const approvedPages = generatedPages.filter((p: any) => p.status === "approved");
    if (approvedPages.length !== storyPages.length) {
      throw new Error(`Not all pages are approved. Approved: ${approvedPages.length}/${storyPages.length}`);
    }

    console.log(`[${orderId}] All ${approvedPages.length} pages approved. Creating PDF...`);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add cover page
    console.log(`[${orderId}] Adding cover page...`);
    const coverResponse = await fetch(personalizedCoverUrl);
    const coverBlob = await coverResponse.blob();
    const coverBuffer = await coverBlob.arrayBuffer();
    const coverBytes = new Uint8Array(coverBuffer);
    const coverImage = await embedImage(pdfDoc, coverBytes, `[${orderId}]`);
    const coverPage = pdfDoc.addPage([coverImage.width, coverImage.height]);
    
    coverPage.drawImage(coverImage, {
      x: 0,
      y: 0,
      width: coverImage.width,
      height: coverImage.height,
    });

    // Add title overlay on cover
    const title = personalizeText(story.title, personalization);
    const titleSize = 48;
    const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);
    
    coverPage.drawText(title, {
      x: (coverImage.width - titleWidth) / 2,
      y: coverImage.height - 80,
      size: titleSize,
      font: titleFont,
      color: rgb(1, 0.91, 0.5), // Golden #FFE97F
    });

    // Add story pages
    for (let i = 0; i < approvedPages.length; i++) {
      const pageData = approvedPages[i];
      console.log(`[${orderId}] Adding page ${pageData.page}...`);

      // Fetch the composited image
      const imageResponse = await fetch(pageData.image_url);
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);
      const image = await embedImage(pdfDoc, imageBytes, `[${orderId}]`);
      const page = pdfDoc.addPage([image.width, image.height]);
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      // Add text overlay
      const rawText = pageData.text || '';
      // Sanitize text: replace line breaks with spaces and collapse multiple spaces
      const pageText = rawText
        .replace(/\r\n/g, ' ')  // Windows line breaks
        .replace(/\n/g, ' ')     // Unix line breaks
        .replace(/\r/g, ' ')     // Old Mac line breaks
        .replace(/\s+/g, ' ')    // Collapse multiple spaces into single space
        .trim();
      
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
        const pageNumText = `${pageData.page}`;
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
        pdf_generated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log(`[${orderId}] ✅ PDF compilation complete!`);

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
    const errorStack = error instanceof Error ? error.stack : '';
    console.error(`Error in compile-storybook-pdf:`, errorMessage);
    console.error(`Stack trace:`, errorStack);
    
    if (orderId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from("orders")
          .update({ 
            error_log: `PDF compilation failed: ${errorMessage}`,
          })
          .eq("id", orderId);
          
        console.log(`[${orderId}] Error saved to database`);
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