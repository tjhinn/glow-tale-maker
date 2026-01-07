/**
 * Flattens a cover image with title text burned into it
 * Uses HTML Canvas to draw both the image and styled text
 */
export async function flattenCoverWithTitle(
  coverUrl: string,
  title: string
): Promise<Blob> {
  // First, fetch the image as a blob to avoid CORS issues
  let imageUrl = coverUrl;
  let objectUrlToCleanup: string | null = null;
  
  try {
    console.log("Fetching cover image as blob to avoid CORS...");
    const response = await fetch(coverUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    imageUrl = URL.createObjectURL(blob);
    objectUrlToCleanup = imageUrl;
    console.log("Successfully created blob URL for cover image");
  } catch (e) {
    console.warn("Could not fetch image as blob, trying direct load:", e);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin if we're using the original URL (not blob URL)
    if (!objectUrlToCleanup) {
      img.crossOrigin = "anonymous";
    }
    
    const cleanup = () => {
      if (objectUrlToCleanup) {
        URL.revokeObjectURL(objectUrlToCleanup);
      }
    };
    
    img.onload = async () => {
      try {
        // Create canvas matching image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          cleanup();
          throw new Error('Could not get canvas context');
        }
        
        // Draw the cover image
        ctx.drawImage(img, 0, 0);
        
        // Calculate responsive font size (5.5% of canvas width)
        const baseFontSize = Math.floor(canvas.width * 0.055);
        
        // Explicitly preload Wonderia font
        try {
          const fontFace = new FontFace('Wonderia', 'url(/fonts/Wonderia.otf)');
          await fontFace.load();
          document.fonts.add(fontFace);
          console.log("Wonderia font loaded successfully for cover flattening");
        } catch (fontError) {
          console.warn("Wonderia font failed to load, using fallback:", fontError);
        }
        
        await document.fonts.ready;
        
        // Configure text styling with fallback fonts
        ctx.font = `${baseFontSize}px "Wonderia", "Fredoka One", cursive`;
        ctx.fillStyle = '#FFE97F';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Calculate position (8% from top, centered horizontally)
        const textX = canvas.width / 2;
        const textY = canvas.height * 0.08;
        
        // Max text width (90% of canvas width for padding)
        const maxWidth = canvas.width * 0.9;
        
        // Word wrap the title if needed
        const words = title.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
        
        // Draw text with shadow effects (multiple passes for glow)
        const lineHeight = baseFontSize * 1.2;
        
        lines.forEach((line, index) => {
          const y = textY + (index * lineHeight);
          
          // First pass: dark shadow
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
          ctx.fillText(line, textX, y);
          
          // Second pass: orange glow
          ctx.shadowColor = 'rgba(255,139,0,0.5)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(line, textX, y);
          
          // Third pass: stroke outline
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.strokeText(line, textX, y);
        });
        
        console.log("Canvas flattening complete, converting to blob...");
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          cleanup();
          if (blob) {
            console.log("Flattened cover blob created successfully");
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png', 1.0);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load cover image'));
    };
    
    img.src = imageUrl;
  });
}
