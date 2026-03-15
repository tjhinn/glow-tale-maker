/**
 * Flattens a cover image with title text burned into it
 * Uses HTML Canvas to draw both the image and styled text
 * @param coverUrl - URL of the cover image
 * @param title - The title text to render
 * @param titleFont - Google Font name to use for the title (default: 'Fredoka')
 */
export async function flattenCoverWithTitle(
  coverUrl: string,
  title: string,
  titleFont: string = 'Fredoka',
  titleColor: string = '#FFFFFF'
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
        
        // Dynamically load the specified Google Font
        try {
          // Inject a style element with the Google Font import if not already loaded
          const styleId = `dynamic-font-${titleFont.replace(/\s+/g, '-')}`;
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(titleFont)}&display=swap');`;
            document.head.appendChild(style);
          }
          // Wait for the font to load
          await document.fonts.load(`48px "${titleFont}"`);
          console.log(`${titleFont} font loaded successfully for cover flattening`);
        } catch (fontError) {
          console.warn(`${titleFont} font failed to load, using fallback:`, fontError);
        }
        
        await document.fonts.ready;
        
        // Configure text styling with the specified font and fallbacks
        ctx.font = `${baseFontSize}px "${titleFont}", "Fredoka", cursive`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Calculate position (12% from top, centered horizontally)
        const textX = canvas.width / 2;
        const textY = canvas.height * 0.12;
        
        // Keep entire title on one line (no word wrapping)
        const line = title;
        const baseY = textY;
        const chars = line.split('');
        let totalWidth = ctx.measureText(line).width;
        
        // Define safe edge margins (10% on each side)
        const edgeMargin = canvas.width * 0.10;
        const maxTitleWidth = canvas.width - (edgeMargin * 2);
        
        // Scale down font if title is too wide
        let currentFontSize = baseFontSize;
        if (totalWidth > maxTitleWidth) {
          const scaleFactor = maxTitleWidth / totalWidth;
          currentFontSize = Math.floor(baseFontSize * scaleFactor);
          ctx.font = `${currentFontSize}px "${titleFont}", "Fredoka", cursive`;
          totalWidth = ctx.measureText(line).width;
          console.log(`Title too wide, scaling font from ${baseFontSize}px to ${currentFontSize}px`);
        }
        
        // Calculate starting X position (natural kerning, no extra spacing)
        let currentX = textX - (totalWidth / 2);
        
        chars.forEach((char, charIndex) => {
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + (charWidth / 2);
          
          // Create visible arc effect - peaks in the middle (like a rainbow)
          const progress = chars.length > 1 ? charIndex / (chars.length - 1) : 0.5;
          const waveOffset = Math.sin(progress * Math.PI) * (currentFontSize * 0.55);
          const charY = baseY - waveOffset;
          
          // Calculate rotation angle based on the derivative of the arc curve
          // The derivative of sin(x * PI) is PI * cos(x * PI)
          const arcDerivative = Math.cos(progress * Math.PI);
          // Scale the rotation - negative because we want left chars to tilt left, right to tilt right
          const rotationAngle = -arcDerivative * 0.25; // ~14 degrees max rotation at edges
          
          ctx.save();
          
          // Translate to character position, rotate, then draw at origin
          ctx.translate(charCenterX, charY);
          ctx.rotate(rotationAngle);
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          
          // Pass 1: Drop shadow for readability (centered behind text)
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = titleColor;
          ctx.fillText(char, 0, 0);
          
          // Pass 2: Thinner white stroke/outline (reduced from 8 to 4)
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.lineWidth = 4;
          ctx.strokeStyle = titleColor;
          ctx.strokeText(char, 0, 0);
          
          // Pass 3: Solid white fill on top
          ctx.fillText(char, 0, 0);
          
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
