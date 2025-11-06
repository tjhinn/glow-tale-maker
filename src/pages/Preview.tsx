import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Confetti } from "@/components/animations/Confetti";
import sample1 from "@/assets/sample-story-1.jpg";

const Preview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [discountApplied, setDiscountApplied] = useState(
    localStorage.getItem("shareDiscount") === "true"
  );
  const [showConfetti, setShowConfetti] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      const shareDiscount = true;
      try {
        await navigator.share({
          title: "Check out my child's fairy tale!",
          text: "I just created an amazing personalized storybook! ✨",
          url: window.location.origin,
        });
        
      if (shareDiscount) {
        localStorage.setItem("shareDiscount", "true");
        setDiscountApplied(true);
        setShowConfetti(true);
        toast({
          title: "🎉 Discount unlocked!",
          description: "10% off applied to your order.",
          className: "bg-success text-success-foreground",
        });
      }
      } catch (err) {
        toast({
          title: "Share cancelled",
          description: "You can still share later to unlock the discount.",
        });
      }
    } else {
      toast({
        title: "Share not available",
        description: "Sharing is not supported on this device.",
      });
    }
  };

  const handleContinue = () => {
    navigate("/checkout");
  };

  return (
    <PageWrapper>
      <Confetti active={showConfetti} count={100} />
      
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Card className="shadow-2xl border-2 border-accent/30 mb-8 relative overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/30 to-primary/20">
            <CardTitle className="text-3xl md:text-4xl text-center font-playfair">
              ✨ See the Magic
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground font-poppins mt-2">
              Here's a peek at your personalized storybook
            </p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Story Preview */}
          <Card className="border-2 border-primary shadow-xl bg-secondary/20 hover:glow-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-poppins">Storybook Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <img
                  src={sample1}
                  alt="Watermarked preview of your personalized storybook"
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary/30 rotate-[-5deg]">
                    <p className="text-lg font-bold text-muted-foreground">PREVIEW</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4 font-poppins">
                Full storybook without watermark delivered after purchase
              </p>
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card className="border-2 border-secondary shadow-xl bg-gradient-to-br from-secondary/30 to-primary/10 hover:glow-accent transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-poppins flex items-center gap-2">
                <Share2 className="w-5 h-5 text-accent" />
                Share & Save
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {discountApplied ? (
                <div className="p-6 rounded-xl bg-success/10 border-2 border-success text-center">
                  <Sparkles className="w-12 h-12 text-success mx-auto mb-3 animate-sparkle" />
                  <p className="text-success font-bold text-lg mb-2 font-poppins">
                    🎉 Discount Active!
                  </p>
                  <p className="text-sm text-success-foreground font-poppins">
                    10% off will be applied at checkout
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground font-poppins">
                    Share your story preview and unlock a special 10% discount!
                  </p>
                  <Button
                    variant="magical"
                    size="lg"
                    onClick={handleShare}
                    className="w-full group"
                  >
                    <Share2 className="w-4 h-4 group-hover:animate-sparkle" />
                    Share & Get 10% Off!
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/stories")}
            className="flex-1"
          >
            ← Choose Different Story
          </Button>
          <Button
            variant="magical"
            size="xl"
            onClick={handleContinue}
            className="flex-1 group"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
            Continue to Checkout
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Preview;
