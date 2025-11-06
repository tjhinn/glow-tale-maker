import { useEffect, useState } from "react";
import { Sparkles as SparklesIcon } from "lucide-react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SparklesProps {
  count?: number;
  className?: string;
}

export const Sparkles = ({ count = 5, className = "" }: SparklesProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const newSparkles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 12,
      delay: Math.random() * 2,
    }));
    setSparkles(newSparkles);
  }, [count]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {sparkles.map((sparkle) => (
        <SparklesIcon
          key={sparkle.id}
          className="absolute text-accent animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
