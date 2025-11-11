import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Sparkles, Facebook, Instagram, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
    
    // Toast notification
    toast({
      title: "🎉 Discount unlocked!",
      description: "10% off applied to your order.",
      className: "bg-success text-success-foreground",
    });

    // Reset confetti after animation completes
    setTimeout(() => setShowConfetti(false), 3500);
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
    const shareText = `I just created "${selectedStory?.title}" - an amazing personalized storybook starring ${personalization?.heroName}! ✨`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    openShareWindowWithConfirmation(url);
  };

  const handleTwitterShare = () => {
    const shareText = `I just created "${selectedStory?.title}" - an amazing personalized storybook starring ${personalization?.heroName}! ✨`;
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

  const personalizeText = (template: string) => {
    if (!personalization) return template;
    return template
      .replace(/{heroName}/g, personalization.heroName)
      .replace(/{petName}/g, personalization.petName)
      .replace(/{petType}/g, personalization.petType)
      .replace(/{city}/g, personalization.city)
      .replace(/{favoriteColor}/g, personalization.favoriteColor || '')
      .replace(/{favoriteFood}/g, personalization.favoriteFood || '');
  };

  if (!personalization || !selectedStory) {
    return null;
  }

  const storyPages = selectedStory.pages || [];
  const currentPage = storyPages[currentPageIndex];

  return (
    <PageWrapper>
      <Confetti active={showConfetti} count={100} />
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-2xl">Did you complete sharing?</AlertDialogTitle>
            <AlertDialogDescription className="font-poppins">
              To unlock your 10% discount, please confirm that you shared {personalization?.heroName}'s magical story!
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
              {personalization.heroName}'s adventure in "{selectedStory.title}"
            </p>
          </CardHeader>
        </Card>

        {/* Story Preview Section - 12 Pages */}
        <Card className="border-2 border-primary/50 shadow-xl bg-gradient-to-br from-secondary/10 to-primary/5 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-playfair flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              Your Story Preview
              <Sparkles className="w-6 h-6 text-primary" />
            </CardTitle>
            <p className="text-sm text-muted-foreground font-poppins mt-2">
              Preview of your personalized 12-page storybook
            </p>
          </CardHeader>
          <CardContent className="p-4 md:p-8 space-y-6">
            {/* Page Navigation */}
            {currentPage && (
              <div className="space-y-4">
                <div className="relative group">
                  <div className="bg-background/95 backdrop-blur-sm p-6 rounded-xl border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-playfair text-primary">Page {currentPageIndex + 1} of {storyPages.length}</h3>
                    </div>
                    <p className="text-base leading-relaxed text-foreground font-poppins">
                      {personalizeText(currentPage.text)}
                    </p>
                  </div>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="bg-background/90 backdrop-blur-sm px-6 md:px-10 py-3 md:py-5 rounded-xl border-2 border-primary/50 rotate-[-2deg] shadow-2xl">
                        <p className="text-lg md:text-2xl font-bold text-primary/70 tracking-widest font-playfair">PREVIEW</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/20 aspect-[4/3] rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <p className="text-muted-foreground text-sm">Illustration will appear here after purchase</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                    disabled={currentPageIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {storyPages.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentPageIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                        }`}
                        aria-label={`Go to page ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPageIndex(Math.min(storyPages.length - 1, currentPageIndex + 1))}
                    disabled={currentPageIndex === storyPages.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <h3 className="text-lg md:text-xl font-playfair text-foreground">
                  Complete 12-Page Storybook
                </h3>
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              </div>
              <p className="text-sm md:text-base text-muted-foreground font-poppins leading-relaxed">
                Your personalized storybook features {personalization.heroName} in beautiful, professionally illustrated spreads — delivered without watermarks after purchase
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Card - Full Width */}
        <Card className="border-2 border-accent/50 shadow-xl bg-gradient-to-br from-accent/10 to-primary/5 hover:shadow-2xl hover:border-accent transition-all duration-300 mb-8">
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
                    Share {personalization.heroName}'s magical story preview to unlock a <span className="font-bold text-primary">special 10% discount!</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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