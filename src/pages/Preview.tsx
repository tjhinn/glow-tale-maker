import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Sparkles, Facebook, Instagram } from "lucide-react";
import { Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Confetti } from "@/components/animations/Confetti";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import sample1 from "@/assets/sample-story-1.jpg";

const Preview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [discountApplied, setDiscountApplied] = useState(
    localStorage.getItem("shareDiscount") === "true"
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [personalization, setPersonalization] = useState<any>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const savedPersonalization = localStorage.getItem("personalizationData");
    const savedStory = localStorage.getItem("selectedStory");

    if (!savedPersonalization || !savedStory) {
      toast({
        title: "Missing information",
        description: "Please complete personalization and story selection first.",
        variant: "destructive",
      });
      navigate("/create");
      return;
    }

    setPersonalization(JSON.parse(savedPersonalization));
    setSelectedStory(JSON.parse(savedStory));
  }, [navigate, toast]);

  const applyDiscount = () => {
    localStorage.setItem("shareDiscount", "true");
    setDiscountApplied(true);
    setShowConfetti(true);
    toast({
      title: "🎉 Discount unlocked!",
      description: "10% off applied to your order.",
      className: "bg-success text-success-foreground",
    });
  };

  const openShareWindowWithConfirmation = (url: string) => {
    const popup = window.open(url, '_blank', 'width=600,height=400');
    
    const handleFocus = () => {
      // Small delay to ensure popup has closed
      setTimeout(() => {
        setShowConfirmDialog(true);
        window.removeEventListener('focus', handleFocus);
      }, 500);
    };
    
    window.addEventListener('focus', handleFocus);
  };

  const handleFacebookShare = () => {
    const shareText = `I just created "${selectedStory?.title}" - an amazing personalized storybook starring ${personalization?.childName}! ✨`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    openShareWindowWithConfirmation(url);
  };

  const handleTwitterShare = () => {
    const shareText = `I just created "${selectedStory?.title}" - an amazing personalized storybook starring ${personalization?.childName}! ✨`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`;
    openShareWindowWithConfirmation(url);
  };

  const handleInstagramShare = async () => {
    const shareUrl = window.location.origin;
    
    try {
      // Copy link to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Open Instagram Web in new tab
      window.open('https://www.instagram.com', '_blank');
      
      // Show simple success toast
      toast({
        title: "Link copied! 📋",
        description: "Instagram opened in a new tab. Paste the link to share!",
        duration: 5000,
      });
      
      // Trigger confirmation dialog for discount
      setShowConfirmDialog(true);
    } catch (error) {
      // Handle clipboard failure
      toast({
        title: "Couldn't copy link",
        description: "Please manually copy the link: " + shareUrl,
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    navigate("/checkout");
  };

  if (!personalization || !selectedStory) {
    return null;
  }

  return (
    <PageWrapper>
      <Confetti active={showConfetti} count={100} />
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-2xl">Did you complete sharing?</AlertDialogTitle>
            <AlertDialogDescription className="font-poppins">
              To unlock your 10% discount, please confirm that you shared {personalization?.childName}'s magical story!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, I didn't share</AlertDialogCancel>
            <AlertDialogAction 
              onClick={applyDiscount}
              className="bg-primary hover:bg-primary/90"
            >
              Yes, I shared it! ✨
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Card className="shadow-2xl border-2 border-accent/30 mb-8 relative overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/30 to-primary/20">
            <CardTitle className="text-3xl md:text-4xl text-center font-playfair">
              ✨ See the Magic
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground font-poppins mt-2">
              {personalization.childName}'s adventure in "{selectedStory.title}"
            </p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Story Preview */}
          <Card className="border-2 border-primary/50 shadow-xl bg-gradient-to-br from-secondary/10 to-primary/5 hover:shadow-2xl hover:border-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-playfair flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Story Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative group">
                <img
                  src={sample1}
                  alt={`Preview of ${selectedStory.title} featuring ${personalization.childName}`}
                  className="w-full rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/90 backdrop-blur-sm px-8 py-4 rounded-xl border-2 border-primary/40 rotate-[-5deg] shadow-xl">
                    <p className="text-xl font-bold text-primary/70 tracking-wider">PREVIEW</p>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-playfair text-foreground">
                  {selectedStory.title}
                </h3>
                <p className="text-sm text-muted-foreground font-poppins italic">
                  Featuring {personalization.childName} as the hero
                </p>
                <p className="text-xs text-muted-foreground font-poppins">
                  Full 24-page storybook without watermark delivered after purchase
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card className="border-2 border-accent/50 shadow-xl bg-gradient-to-br from-accent/10 to-primary/5 hover:shadow-2xl hover:border-accent transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-playfair flex items-center gap-2">
                <Share2 className="w-5 h-5 text-accent" />
                Share & Save
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {discountApplied ? (
                <div className="p-8 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border-2 border-success text-center space-y-3">
                  <Sparkles className="w-16 h-16 text-success mx-auto animate-pulse" />
                  <div>
                    <p className="text-success font-bold text-xl mb-2 font-playfair">
                      🎉 Discount Unlocked!
                    </p>
                    <p className="text-sm text-muted-foreground font-poppins">
                      10% off will be applied at checkout
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-center text-foreground font-poppins leading-relaxed">
                      Share {personalization.childName}'s magical story preview to unlock a <span className="font-bold text-primary">special 10% discount!</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleFacebookShare}
                      className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                    >
                      <Facebook className="w-5 h-5 mr-2" />
                      Share on Facebook
                    </Button>
                    
                    <Button
                      onClick={handleTwitterShare}
                      className="w-full bg-black hover:bg-black/90 text-white"
                    >
                      <Twitter className="w-5 h-5 mr-2" />
                      Share on X
                    </Button>
                    
                    <Button
                      onClick={handleInstagramShare}
                      className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white"
                    >
                      <Instagram className="w-5 h-5 mr-2" />
                      Share on Instagram
                    </Button>
                  </div>
                </div>
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
