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
        
        // Calculate responsive font size (8% of canvas width - larger for playful look)
        const baseFontSize = Math.floor(canvas.width * 0.08);
        
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
        
        // Keep entire title on one line (no word wrapping)
        const line = title;
        const baseY = textY;
        const chars = line.split('');
        const totalWidth = ctx.measureText(line).width;
        
        // Calculate starting X position (natural kerning, no extra spacing)
        let currentX = textX - (totalWidth / 2);
        
        chars.forEach((char, charIndex) => {
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + (charWidth / 2);
          
          // Create visible arc effect - peaks in the middle (like a rainbow)
          const progress = chars.length > 1 ? charIndex / (chars.length - 1) : 0.5;
          const waveOffset = Math.sin(progress * Math.PI) * (baseFontSize * 0.35);
          const charY = baseY - waveOffset;
          
          // Calculate rotation angle based on the derivative of the arc curve
          // The derivative of sin(x * PI) is PI * cos(x * PI)
          const arcDerivative = Math.cos(progress * Math.PI);
          // Scale the rotation - negative because we want left chars to tilt left, right to tilt right
          const rotationAngle = -arcDerivative * 0.15; // ~8.5 degrees max rotation at edges
          
          ctx.save();
          
          // Translate to character position, rotate, then draw at origin
          ctx.translate(charCenterX, charY);
          ctx.rotate(rotationAngle);
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          
          // First pass: dark shadow (enhanced for larger text)
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
          ctx.fillText(char, 0, 0);
          
          // Second pass: orange glow (enhanced)
          ctx.shadowColor = 'rgba(255,139,0,0.5)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(char, 0, 0);
          
          // Third pass: stroke outline
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.strokeText(char, 0, 0);
          
          ctx.restore();
          
          currentX += charWidth;
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
