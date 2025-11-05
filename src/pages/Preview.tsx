import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import sample1 from "@/assets/sample-story-1.jpg";

const Preview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [discountApplied, setDiscountApplied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my child's personalized fairy tale!",
          text: "I just created an amazing personalized storybook with YourFairyTale.ai! ✨",
          url: window.location.origin,
        });
        
        // Apply discount on successful share
        setDiscountApplied(true);
        localStorage.setItem("shareDiscount", "true");
        
        // Show confetti-like success
        toast({
          title: "🎉 Discount unlocked!",
          description: "You've earned 10% off for sharing the magic!",
          className: "bg-success text-success-foreground",
        });
      } catch (err) {
        // User cancelled share
        toast({
          title: "No worries!",
          description: "You can share later to get your discount.",
        });
      }
    } else {
      toast({
        title: "Share not supported",
        description: "Sharing is not available on this device, but you can still continue!",
      });
    }
  };

  const handleContinue = () => {
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-md border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            YourFairyTale.ai
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Card className="shadow-2xl border-2 border-primary/20 mb-8">
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20">
            <CardTitle className="text-3xl md:text-4xl text-center font-bold">
              ✨ See the Magic
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Preview Image */}
          <Card className="border-2 border-secondary shadow-xl bg-secondary/20">
            <CardContent className="p-6">
              <div className="relative">
                <img
                  src={sample1}
                  alt="Story preview"
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary/30 rotate-[-5deg]">
                    <p className="text-xl font-bold text-muted-foreground">PREVIEW</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Watermarked preview - full storybook unlocked after purchase
              </p>
            </CardContent>
          </Card>

          {/* Share for Discount */}
          <Card className="border-2 border-secondary shadow-xl bg-gradient-to-br from-secondary/30 to-accent/10">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <Sparkles className="w-16 h-16 text-primary mx-auto animate-sparkle" />
                <h3 className="text-2xl font-bold">Share the Magic!</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Share your preview with friends and family to unlock an instant{" "}
                  <span className="text-accent font-bold text-xl">10% discount</span> on your purchase!
                </p>
              </div>

              {discountApplied ? (
                <div className="p-6 rounded-xl bg-success/10 border-2 border-success text-center space-y-2">
                  <p className="text-2xl font-bold text-success">🎉 Discount Active!</p>
                  <p className="text-sm text-success-foreground">
                    Your 10% discount will be applied at checkout
                  </p>
                </div>
              ) : (
                <Button
                  variant="magic"
                  size="xl"
                  onClick={handleShare}
                  className="w-full"
                >
                  <Share2 className="w-5 h-5" />
                  Share & Get 10% Off!
                </Button>
              )}

              <div className="pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Ready to continue without discount?
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue to Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/stories")}
            className="border-2 border-muted"
          >
            ← Choose Different Story
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Preview;
