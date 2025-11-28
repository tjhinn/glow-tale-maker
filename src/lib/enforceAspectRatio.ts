/**
 * Enforces a 4:3 aspect ratio on an image by center-cropping if needed.
 * Returns the original URL if the aspect ratio is already correct.
 */
export async function enforceAspectRatio(
  imageUrl: string,
  targetRatio: number = 4 / 3
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const currentRatio = img.width / img.height;

      // If already correct ratio (within 1% tolerance), return as-is
      if (Math.abs(currentRatio - targetRatio) < 0.01) {
        resolve(imageUrl);
        return;
      }

      console.log(
        `Aspect ratio correction needed: ${currentRatio.toFixed(2)} → ${targetRatio.toFixed(2)}`
      );

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Calculate target dimensions
      let targetWidth: number, targetHeight: number;

      if (currentRatio > targetRatio) {
        // Image is too wide, crop horizontally
        targetHeight = img.height;
        targetWidth = targetHeight * targetRatio;
      } else {
        // Image is too tall, crop vertically
        targetWidth = img.width;
        targetHeight = targetWidth / targetRatio;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Center crop
      const sourceX = (img.width - targetWidth) / 2;
      const sourceY = (img.height - targetHeight) / 2;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        targetWidth,
        targetHeight, // source
        0,
        0,
        targetWidth,
        targetHeight // destination
      );

      console.log(
        `Aspect ratio corrected: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`
      );

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image for aspect ratio correction"));
    img.src = imageUrl;
  });
}
