import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Batch configuration
const PAGES_PER_BATCH = 4;
const TOTAL_BATCHES = 3;

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

// Convert color name to RGB
function colorNameToRgb(colorName: string): { r: number; g: number; b: number } {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    red: { r: 0.9, g: 0.2, b: 0.2 },
    blue: { r: 0.2, g: 0.4, b: 0.9 },
    green: { r: 0.2, g: 0.7, b: 0.3 },
    yellow: { r: 0.95, g: 0.8, b: 0.1 },
    orange: { r: 1, g: 0.55, b: 0 },
    purple: { r: 0.6, g: 0.2, b: 0.8 },
    pink: { r: 1, g: 0.4, b: 0.7 },
    brown: { r: 0.6, g: 0.4, b: 0.2 },
    black: { r: 0.1, g: 0.1, b: 0.1 },
    white: { r: 0.95, g: 0.95, b: 0.95 },
  };
  return colors[colorName.toLowerCase()] || { r: 0.2, g: 0.2, b: 0.8 };
}

// Parse text and identify personalized words
interface TextSegment {
  text: string;
  isPersonalized: boolean;
}

function parseTextWithPersonalization(text: string, personalization: any): TextSegment[] {
  const personalizedValues = [
    personalization.heroName,
    personalization.petName,
    personalization.petType,
    personalization.city,
    personalization.favoriteColor,
    personalization.favoriteFood,
  ].filter(Boolean);

  const segments: TextSegment[] = [];
  const words = text.split(' ');

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
    const isPersonalized = personalizedValues.some(
      (val: string) => val && cleanWord === val.toLowerCase()
    );
    segments.push({ text: word, isPersonalized });
  }

  return segments;
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

// Add a story page to the PDF with text overlay
async function addStoryPage(
  pdfDoc: any,
  pageData: any,
  personalization: any,
  regularFont: any,
  boldFont: any,
  logPrefix: string
) {
  // Fetch the composited image
  const imageResponse = await fetch(pageData.image_url);
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  const imageBytes = new Uint8Array(imageBuffer);
  const image = await embedImage(pdfDoc, imageBytes, logPrefix);
  const page = pdfDoc.addPage([image.width, image.height]);
  
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  // Add text overlay with personalized word highlighting
  const rawText = pageData.text || '';
  const pageText = rawText
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (pageText) {
    const textBoxHeight = 196;        // Reduced by 30%
    const textBoxPadding = 30;
    const baseFontSize = 31;          // Reduced by 30%
    const personalizedFontSize = 36;  // Reduced by 30%
    const lineHeight = 42;            // Reduced by 30%
    const textBoxX = 40;
    const textBoxY = 0;               // Bleeds to bottom edge of page
    const textBoxWidth = image.width - 80;
    const maxTextWidth = textBoxWidth - 40;
    
    // Draw semi-transparent background for text
    page.drawRectangle({
      x: textBoxX,
      y: textBoxY,
      width: textBoxWidth,
      height: textBoxHeight,
      color: rgb(1, 1, 1),
      opacity: 0.75,  // More transparent to show illustration
    });
    
    // Parse text into segments
    const segments = parseTextWithPersonalization(pageText, personalization);
    const favoriteColor = colorNameToRgb(personalization.favoriteColor || 'blue');
    
    // PASS 1: Build lines array with segments and widths
    interface TextLine {
      segments: Array<{ text: string; isPersonalized: boolean; width: number }>;
      totalWidth: number;
    }
    
    const lines: TextLine[] = [];
    let currentLine: TextLine = { segments: [], totalWidth: 0 };
    
    for (const segment of segments) {
      const font = segment.isPersonalized ? boldFont : regularFont;
      const fontSize = segment.isPersonalized ? personalizedFontSize : baseFontSize;
      const wordWidth = font.widthOfTextAtSize(segment.text + ' ', fontSize);
      
      // Check if word fits on current line
      if (currentLine.totalWidth + wordWidth > maxTextWidth && currentLine.segments.length > 0) {
        lines.push(currentLine);
        currentLine = { segments: [], totalWidth: 0 };
      }
      
      currentLine.segments.push({ 
        text: segment.text, 
        isPersonalized: segment.isPersonalized, 
        width: wordWidth 
      });
      currentLine.totalWidth += wordWidth;
    }
    if (currentLine.segments.length > 0) lines.push(currentLine);
    
    // Calculate total text height and vertical start position (centered)
    const totalTextHeight = lines.length * lineHeight;
    const verticalPadding = (textBoxHeight - totalTextHeight) / 2;
    let currentY = textBoxY + textBoxHeight - verticalPadding - baseFontSize;
    
    // PASS 2: Render each line centered horizontally
    for (const line of lines) {
      const lineStartX = textBoxX + (textBoxWidth - line.totalWidth) / 2;
      let currentX = lineStartX;
      
      for (const seg of line.segments) {
        const font = seg.isPersonalized ? boldFont : regularFont;
        const fontSize = seg.isPersonalized ? personalizedFontSize : baseFontSize;
        const color = seg.isPersonalized 
          ? rgb(favoriteColor.r, favoriteColor.g, favoriteColor.b)
          : rgb(0, 0, 0);
        
        page.drawText(seg.text + ' ', {
          x: currentX,
          y: currentY,
          size: fontSize,
          font: font,
          color: color,
        });
        
        currentX += seg.width;
      }
      
      currentY -= lineHeight;
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
    const batch = body.batch || 1; // Default to batch 1
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${orderId}] Starting PDF compilation batch ${batch}/${TOTAL_BATCHES}...`);

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
    const batchProgress = (order.pdf_batch_progress as any) || {};
    
    if (!personalizedCoverUrl) {
      throw new Error(`No personalized cover found for order ${orderId}`);
    }

    const story = (order as any).stories;
    const storyPages = story.pages as any[];

    // Verify all pages are generated and approved
    const approvedPages = generatedPages
      .filter((p: any) => p.status === "approved")
      .sort((a: any, b: any) => a.page - b.page);
    
    if (approvedPages.length !== storyPages.length) {
      throw new Error(`Not all pages are approved. Approved: ${approvedPages.length}/${storyPages.length}`);
    }

    // Calculate which pages this batch handles
    const startPageIndex = (batch - 1) * PAGES_PER_BATCH;
    const endPageIndex = Math.min(startPageIndex + PAGES_PER_BATCH, approvedPages.length);
    const batchPages = approvedPages.slice(startPageIndex, endPageIndex);

    console.log(`[${orderId}] Batch ${batch}: Processing pages ${startPageIndex + 1} to ${endPageIndex}`);

    let pdfDoc;
    let regularFont;
    let boldFont;

    if (batch === 1) {
      // BATCH 1: Create new PDF, embed fonts, add cover + first pages
      console.log(`[${orderId}] Creating new PDF document...`);
      pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      // Embed fonts from Google Fonts GitHub repository
      const funnelSansUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/funnelsans/FunnelSans-Regular.ttf';
      const bubblegumSansUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/bubblegumsans/BubblegumSans-Regular.ttf';

      // Fetch both fonts in parallel
      const [funnelResponse, bubblegumResponse] = await Promise.all([
        fetch(funnelSansUrl),
        fetch(bubblegumSansUrl)
      ]);

      if (!funnelResponse.ok) {
        throw new Error(`Failed to fetch Funnel Sans font: ${funnelResponse.status}`);
      }
      if (!bubblegumResponse.ok) {
        throw new Error(`Failed to fetch Bubblegum Sans font: ${bubblegumResponse.status}`);
      }

      const [funnelBytes, bubblegumBytes] = await Promise.all([
        funnelResponse.arrayBuffer(),
        bubblegumResponse.arrayBuffer()
      ]);

      console.log(`[${orderId}] Fonts loaded: FunnelSans=${funnelBytes.byteLength} bytes, BubblegumSans=${bubblegumBytes.byteLength} bytes`);

      regularFont = await pdfDoc.embedFont(funnelBytes);   // Funnel Sans for regular text
      boldFont = await pdfDoc.embedFont(bubblegumBytes);   // Bubblegum Sans for personalized words

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

      // Add story pages for batch 1
      for (const pageData of batchPages) {
        console.log(`[${orderId}] Adding page ${pageData.page}...`);
        await addStoryPage(pdfDoc, pageData, personalization, regularFont, boldFont, `[${orderId}]`);
      }

    } else {
      // BATCH 2+: Load existing partial PDF and continue
      const partialPdfPath = batchProgress.partialPdfPath;
      if (!partialPdfPath) {
        throw new Error(`No partial PDF found for batch ${batch}. Did batch ${batch - 1} complete?`);
      }

      console.log(`[${orderId}] Loading partial PDF from storage: ${partialPdfPath}`);
      
      const { data: pdfData, error: downloadError } = await supabase.storage
        .from("generated-pdfs")
        .download(partialPdfPath);

      if (downloadError || !pdfData) {
        throw new Error(`Failed to download partial PDF: ${JSON.stringify(downloadError) || 'No data returned'}`);
      }

      const existingPdfBytes = await pdfData.arrayBuffer();
      pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);

      // Re-embed fonts (required after loading existing PDF)
      const funnelSansUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/funnelsans/FunnelSans-Regular.ttf';
      const bubblegumSansUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/bubblegumsans/BubblegumSans-Regular.ttf';

      const [funnelResponse, bubblegumResponse] = await Promise.all([
        fetch(funnelSansUrl),
        fetch(bubblegumSansUrl)
      ]);

      const [funnelBytes, bubblegumBytes] = await Promise.all([
        funnelResponse.arrayBuffer(),
        bubblegumResponse.arrayBuffer()
      ]);

      regularFont = await pdfDoc.embedFont(funnelBytes);   // Funnel Sans for regular text
      boldFont = await pdfDoc.embedFont(bubblegumBytes);   // Bubblegum Sans for personalized words

      // Add story pages for this batch
      for (const pageData of batchPages) {
        console.log(`[${orderId}] Adding page ${pageData.page}...`);
        await addStoryPage(pdfDoc, pageData, personalization, regularFont, boldFont, `[${orderId}]`);
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log(`[${orderId}] Batch ${batch} PDF saved: ${pdfBytes.byteLength} bytes`);

    // Update batch progress
    const completedBatches = [...(batchProgress.completedBatches || []), batch];
    const isComplete = batch === TOTAL_BATCHES;

    if (isComplete) {
      // FINAL BATCH: Upload as final PDF and update order
      console.log(`[${orderId}] Uploading final PDF to storage...`);
      
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

      // Clean up partial PDFs
      if (batchProgress.partialPdfPath) {
        await supabase.storage
          .from("generated-pdfs")
          .remove([batchProgress.partialPdfPath]);
      }

      // Update order with final PDF URL and status
      await supabase
        .from("orders")
        .update({
          status: "pending_admin_review",
          pdf_url: signedUrlData.signedUrl,
          pdf_generated_at: new Date().toISOString(),
          pdf_batch_progress: null, // Clear progress on completion
        })
        .eq("id", orderId);

      console.log(`[${orderId}] ✅ PDF compilation complete!`);

      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          batch,
          completed: true,
          nextBatch: null,
          pdfUrl: signedUrlData.signedUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // NOT FINAL: Upload as partial PDF for next batch
      const partialFileName = `partial/${orderId}-batch-${batch}.pdf`;
      
      console.log(`[${orderId}] Uploading partial PDF: ${partialFileName}`);

      // Upload new partial PDF FIRST (before deleting old one to prevent race condition)
      const { error: uploadError } = await supabase.storage
        .from("generated-pdfs")
        .upload(partialFileName, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload partial PDF: ${uploadError.message}`);
      }

      // Only delete old partial AFTER new one is confirmed uploaded
      if (batchProgress.partialPdfPath && batchProgress.partialPdfPath !== partialFileName) {
        await supabase.storage
          .from("generated-pdfs")
          .remove([batchProgress.partialPdfPath]);
      }

      // Update batch progress in order
      await supabase
        .from("orders")
        .update({
          pdf_batch_progress: {
            currentBatch: batch,
            totalBatches: TOTAL_BATCHES,
            completedBatches,
            partialPdfPath: partialFileName,
          },
        })
        .eq("id", orderId);

      console.log(`[${orderId}] Batch ${batch} complete. Ready for batch ${batch + 1}.`);

      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          batch,
          completed: false,
          nextBatch: batch + 1,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
