import { useRef, useState, useEffect, useCallback } from "react";

interface AutoFitTitleProps {
  text: string;
  fontFamily: string;
  color: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}

/**
 * A title component that dynamically sizes text to fill available container width.
 * Uses binary search to find optimal font size for consistent visual weight across different fonts.
 */
export const AutoFitTitle = ({
  text,
  fontFamily,
  color,
  className = "",
  minFontSize = 18,
  maxFontSize = 42,
}: AutoFitTitleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isReady, setIsReady] = useState(false);

  const calculateOptimalSize = useCallback(() => {
    const container = containerRef.current;
    if (!container || !text) return;

    const containerWidth = container.offsetWidth;
    if (containerWidth === 0) return;

    // Create temporary span to measure text width
    const measureSpan = document.createElement("span");
    measureSpan.style.fontFamily = fontFamily;
    measureSpan.style.visibility = "hidden";
    measureSpan.style.position = "absolute";
    measureSpan.style.whiteSpace = "nowrap";
    measureSpan.style.fontWeight = "700";
    measureSpan.innerText = text;
    document.body.appendChild(measureSpan);

    // Binary search for optimal font size (fills ~92% of container)
    let low = minFontSize;
    let high = maxFontSize;
    let optimalSize = minFontSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      measureSpan.style.fontSize = `${mid}px`;

      if (measureSpan.offsetWidth <= containerWidth * 0.92) {
        optimalSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    document.body.removeChild(measureSpan);
    setFontSize(optimalSize);
    setIsReady(true);
  }, [text, fontFamily, minFontSize, maxFontSize]);

  useEffect(() => {
    // Wait for fonts to be ready before calculating
    document.fonts.ready.then(() => {
      calculateOptimalSize();
    });

    // Also recalculate on resize
    const handleResize = () => {
      calculateOptimalSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateOptimalSize]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <h3
        style={{
          fontFamily,
          color,
          fontSize: `${fontSize}px`,
          textAlign: "center",
          whiteSpace: "nowrap",
          fontWeight: 700,
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        {text}
      </h3>
    </div>
  );
};
