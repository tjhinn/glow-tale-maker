import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Confetti } from "@/components/animations/Confetti";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import sample1 from "@/assets/sample-story-1.jpg";
const ThankYou = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [childName, setChildName] = useState<string>("");
  useEffect(() => {
    setShowConfetti(true);

    // Get child's name from localStorage
    const personalizationData = localStorage.getItem("personalization");
    if (personalizationData) {
      const data = JSON.parse(personalizationData);
      setChildName(data.name || "your little hero");
    }

    // Clear localStorage after 3 seconds
    const clearTimer = setTimeout(() => {
      localStorage.removeItem("personalization");
      localStorage.removeItem("selectedStory");
      localStorage.removeItem("shareDiscount");
      localStorage.removeItem("orderId");
    }, 3000);
    return () => clearTimeout(clearTimer);
  }, []);
  const handleBackHome = () => {
    navigate("/");
  };
  return <PageWrapper>
      <Confetti active={showConfetti} count={150} />
      <SparklesAnimation count={12} className="opacity-40" />
      
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Success Message */}
        <Card className="shadow-2xl border-4 border-success mb-8 bg-gradient-to-br from-success/5 to-primary/5 relative overflow-hidden glow-soft">
          <SparklesAnimation count={8} className="opacity-30" />
          <CardHeader className="text-center space-y-6 py-12 relative">
            <div className="flex justify-center">
              <Sparkles className="w-20 h-20 text-success animate-sparkle" />
            </div>
            <CardTitle className="text-4xl md:text-5xl font-playfair text-success leading-tight">
              ✨ The magic is brewing! ✨
            </CardTitle>
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-2xl text-foreground font-poppins">
                {childName}'s adventure is being crafted with love
              </p>
              <p className="text-lg text-muted-foreground font-poppins leading-relaxed">Our fairy tale artists are illustrating every page of this magical story. You will receive a personalized storybook via email within 24 hours.
The wait will be worth it!'s personalized storybook via email within 24 hours. The wait will be worth it! 🌟{childName}'s personalized storybook via email within 24 hours. 
                The wait will be worth it! 🌟
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Preview Sneak Peek */}
        <Card className="shadow-xl border-2 border-primary/30 mb-8 hover:glow-primary transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20">
            <CardTitle className="text-2xl text-center font-playfair">
              A Sneak Peek at the Magic
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <div className="mb-6 relative group">
              <img src={sample1} alt="Preview of your personalized storybook cover featuring your child as the hero" className="w-full max-w-md mx-auto rounded-lg shadow-2xl group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
            
            <p className="text-base text-muted-foreground font-poppins">
              ✨ Watch your inbox! Your completed storybook will arrive within 24 hours.
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="magical" size="lg" onClick={handleBackHome} className="group">
            <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
            Create Another Fairy Tale
          </Button>
          <p className="text-xs text-muted-foreground font-poppins mt-4">
            ✨ Ready to craft more magical memories?
          </p>
        </div>
      </div>
    </PageWrapper>;
};
export default ThankYou;