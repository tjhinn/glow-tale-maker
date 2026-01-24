import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "@/components/animations/Sparkles";

interface GenerationLoadingModalProps {
  isOpen: boolean;
  heroName: string;
}

export const GenerationLoadingModal = ({ isOpen, heroName }: GenerationLoadingModalProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const steps = [
    { message: "✨ Preparing the magic...", delay: 0 },
    { message: `🎨 Bringing ${heroName} into the story...`, delay: 3000 },
    { message: "🖌️ Adding artistic touches...", delay: 8000 },
    { message: "✍️ Weaving the tale together...", delay: 13000 },
    { message: "🌟 Adding finishing sparkles...", delay: 17000 },
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep("");
      return;
    }

    // Set initial step
    setCurrentStep(steps[0].message);

    // Progress animation: 0% -> 95% over ~20 seconds
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 2; // Fast start (0-30% in 3s)
        if (prev < 70) return prev + 0.8; // Slower (30-70% in 10s)
        if (prev < 95) return prev + 0.3; // Very slow (70-95% in 7s)
        return prev; // Hold at 95%
      });
    }, 200);

    // Step messages
    const stepTimeouts = steps.map((step) =>
      setTimeout(() => setCurrentStep(step.message), step.delay)
    );

    return () => {
      clearInterval(progressInterval);
      stepTimeouts.forEach(clearTimeout);
    };
  }, [isOpen, heroName]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md text-center border-primary/20">
        <div className="relative">
          <Sparkles count={8} className="opacity-60" />
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles count={3} />
            </div>
          </div>
        </div>
        
        <AlertDialogTitle className="text-2xl font-heading text-foreground">
          Creating Your Story...
        </AlertDialogTitle>
        
        <Progress value={progress} className="my-6 h-3" />
        
        <AlertDialogDescription className="text-base text-foreground/80 mb-2">
          {currentStep}
        </AlertDialogDescription>
        
        <p className="text-xs text-muted-foreground">
          This usually takes 15-20 seconds. Please don't close this window.
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
};
