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
import { supabase } from "@/integrations/supabase/client";

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
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

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

  // Resolve and repair cover image URL if needed
  useEffect(() => {
    if (!selectedStory) return;

    const raw = selectedStory.cover_image_url as string | null | undefined;
    if (!raw) { setCoverUrl(null); return; }

    const isHttp = /^https?:\/\//i.test(raw);
    const isWrongBucket = typeof raw === 'string' && raw.includes('/object/public/story-assets');

    if (isHttp && !isWrongBucket) {
      setCoverUrl(raw);
      return;
    }

    const path = isWrongBucket ? raw.split('/story-assets/')[1] : raw;
    const { data } = supabase.storage.from('story-images').getPublicUrl(path);
    const url = data?.publicUrl || raw;
    setCoverUrl(url);

    try {
      const repaired = { ...selectedStory, cover_image_url: url };
      setSelectedStory(repaired);
      localStorage.setItem('selectedStory', JSON.stringify(repaired));
    } catch {}
  }, [selectedStory]);

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
    const shareText = `I just created "${personalizeSimpleText(selectedStory?.title || '')}" - an amazing personalized storybook starring ${personalization?.heroName}! ✨`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    openShareWindowWithConfirmation(url);
  };

  const handleTwitterShare = () => {
    const shareText = `I just created "${personalizeSimpleText(selectedStory?.title || '')}" - an amazing personalized storybook starring ${personalization?.heroName}! ✨`;
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

  const personalizeSimpleText = (template: string) => {
    if (!personalization || !template) return template;
    
    const replacements: Record<string, string> = {
      '{heroName}': personalization.heroName,
      '{petName}': personalization.petName,
      '{petType}': personalization.petType,
      '{petPronoun}': personalization.gender === 'boy' ? 'his' : 'her',
      '{city}': personalization.city,
      '{favoriteColor}': personalization.favoriteColor || '',
      '{favoriteFood}': personalization.favoriteFood || '',
    };
    
    let result = template;
    Object.entries(replacements).forEach(([token, value]) => {
      if (value) result = result.split(token).join(value);
    });
    
    return result;
  };

  const renderPersonalizedText = (template: string) => {
    if (!personalization) return template;
    
    const tokens: Record<string, string> = {
      '{heroName}': personalization.heroName,
      '{petName}': personalization.petName,
      '{petType}': personalization.petType,
      '{petPronoun}': personalization.gender === 'boy' ? 'his' : 'her',
      '{city}': personalization.city,
      '{favoriteColor}': personalization.favoriteColor || '',
      '{favoriteFood}': personalization.favoriteFood || '',
    };
    
    // Replace tokens with HIGHLIGHT markers
    let result = template;
    Object.entries(tokens).forEach(([token, value]) => {
      if (value) {
        result = result.split(token).join(`<HIGHLIGHT>${value}</HIGHLIGHT>`);
      }
    });
    
    // Split by HIGHLIGHT tags and create React elements
    const segments = result.split(/<HIGHLIGHT>|<\/HIGHLIGHT>/);
    return (
      <>
        {segments.map((segment, index) => {
          // Odd indices are highlighted content
          if (index % 2 === 1) {
            return (
              <span 
                key={index}
                className="font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
              >
                {segment}
              </span>
            );
          }
          return segment;
        })}
      </>
    );
  };

  if (!personalization || !selectedStory) {
    return null;
  }

  const storyPages = selectedStory.pages || [];

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
              {personalization.heroName}'s adventure in "{personalizeSimpleText(selectedStory.title)}"
            </p>
          </CardHeader>
        </Card>

        {/* Personalized Scene Illustration Showcase */}
        <Card className="border-2 border-primary/50 shadow-xl bg-gradient-to-br from-secondary/10 to-primary/5 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-playfair flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              {personalization.heroName}'s Adventure Awaits
              <Sparkles className="w-6 h-6 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="relative max-w-2xl mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl"></div>
              
              {/* Main image with frame */}
              <div className="relative rounded-2xl overflow-hidden border-4 border-primary/40 shadow-2xl">
                <img 
                  src={personalization.personalizedCoverUrl}
                  alt={`${personalization.heroName}'s magical adventure`}
                  className="w-full h-auto"
                />
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="bg-background/60 backdrop-blur-sm px-6 py-2 rounded-lg rotate-[-15deg]">
                    <p className="text-sm font-medium text-muted-foreground">PREVIEW</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Caption */}
            <p className="text-center mt-6 font-playfair text-xl text-primary">
              {personalizeSimpleText(selectedStory.title)}
            </p>
            <p className="text-center mt-2 text-sm text-muted-foreground">
              This personalized illustration will appear throughout your storybook
            </p>
          </CardContent>
        </Card>

        {/* New Preview Layout */}
        <div className="space-y-8 mb-8">
          
          {/* Story Preview: First 3 Pages Only */}
          <Card className="border-2 border-accent/50 shadow-xl bg-gradient-to-br from-accent/5 to-background">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-playfair">
                ✨ Story Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground font-poppins mt-2">
                Here's a sneak peek of the first 3 pages
              </p>
            </CardHeader>
            <CardContent className="p-4 md:p-8 space-y-6">
              {storyPages.slice(0, 3).map((page: any, index: number) => (
                <div 
                  key={index}
                  className="bg-background/95 backdrop-blur-sm p-6 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <h3 className="text-lg font-playfair text-primary mb-3">
                    Page {page.page}
                  </h3>
                  <p className="text-base leading-relaxed font-poppins">
                    {renderPersonalizedText(page.text)}
                  </p>
                </div>
              ))}
              
              {/* Teaser for remaining pages */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 rounded-xl p-8 text-center space-y-3">
                <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
                <p className="font-playfair text-xl text-foreground">
                  9 more magical pages await!
                </p>
                <p className="text-sm text-muted-foreground font-poppins">
                  Complete your purchase to unlock the full 12-page illustrated storybook
                </p>
              </div>
            </CardContent>
          </Card>
          
        </div>

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
            onClick={() => {
              // Clear the personalized cover when going back to choose a different story
              const saved = localStorage.getItem("personalizationData");
              if (saved) {
                const data = JSON.parse(saved);
                delete data.personalizedCoverUrl;
                localStorage.setItem("personalizationData", JSON.stringify(data));
              }
              navigate("/stories");
            }}
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