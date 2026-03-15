import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Sparkles, Facebook, Instagram, RefreshCw } from "lucide-react";
import { Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Confetti } from "@/components/animations/Confetti";
import { GenerationLoadingModal } from "@/components/story/GenerationLoadingModal";
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
import { startCoverGeneration, pollForCoverCompletion } from "@/lib/coverGenerationPolling";

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
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  const handleRegenerateCover = async () => {
    if (!personalization || !selectedStory) return;
    
    setIsRegenerating(true);
    
    try {
      // Prepare personalized title
      const personalizedTitle = personalizeSimpleText(selectedStory.title);
      
      // Get the original story cover URL
      let coverImageUrl = selectedStory.cover_image_url;
      if (coverImageUrl && !coverImageUrl.startsWith('http')) {
        const { data } = supabase.storage.from('story-images').getPublicUrl(coverImageUrl);
        coverImageUrl = data.publicUrl;
      }
      
      // Start generation job and poll for completion
      let data: { personalizedCoverUrl?: string } | undefined;
      try {
        // Start the job (returns immediately with job ID)
        const jobId = await startCoverGeneration({
          heroPhotoUrl: personalization.heroPhotoUrl,
          coverImageUrl: coverImageUrl,
          personalizedTitle: personalizedTitle,
          petType: personalization.petType,
          petName: personalization.petName,
          favoriteColor: personalization.favoriteColor,
          illustrationStyle: selectedStory.illustration_style,
          heroGender: personalization.gender,
          storyTheme: selectedStory.moral,
        });
        
        console.log("Cover regeneration job started:", jobId);
        
        // Poll for completion (up to 3 minutes)
        const result = await pollForCoverCompletion(jobId, {
          maxAttempts: 60,
          intervalMs: 3000,
          onStatusChange: (status) => console.log("Regeneration status:", status)
        });
        
        data = { personalizedCoverUrl: result.personalizedCoverUrl };
      } catch (genError: unknown) {
        console.error("Cover regeneration error:", genError);
        throw genError;
      }
      
      if (data?.personalizedCoverUrl) {
        // Import utilities dynamically
        const { flattenCoverWithTitle } = await import("@/lib/flattenCoverWithTitle");
        const { enforceAspectRatio } = await import("@/lib/enforceAspectRatio");
        
        let flattenedCoverUrl: string | null = null;
        const MAX_FLATTEN_ATTEMPTS = 2;
        
        for (let attempt = 1; attempt <= MAX_FLATTEN_ATTEMPTS; attempt++) {
          try {
            console.log(`Cover flattening attempt ${attempt}/${MAX_FLATTEN_ATTEMPTS}...`);
            
            // Enforce 4:3 aspect ratio
            const aspectRatioCorrectedUrl = await enforceAspectRatio(data.personalizedCoverUrl);
            
            // Get the title font and color from the story (with fallbacks)
            const titleFont = selectedStory.title_font || 'Fredoka';
            const titleColor = selectedStory.title_color || '#FFD700';
            
            // Flatten the cover with title text using story-specific font and color
            const flattenedBlob = await flattenCoverWithTitle(
              aspectRatioCorrectedUrl,
              personalizedTitle,
              titleFont,
              titleColor
            );
            
            // Upload flattened image to storage
            const fileName = `flattened-cover-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
              .from('hero-photos')
              .upload(fileName, flattenedBlob, { contentType: 'image/png' });
            
            if (uploadError) {
              throw new Error(`Upload failed: ${uploadError.message}`);
            }
            
            // Get public URL of the flattened image
            const { data: urlData } = supabase.storage
              .from('hero-photos')
              .getPublicUrl(fileName);
            
            flattenedCoverUrl = urlData.publicUrl;
            console.log("Regenerated cover with title uploaded:", flattenedCoverUrl);
            break; // Success, exit retry loop
            
          } catch (flattenError) {
            console.error(`Flatten attempt ${attempt} failed:`, flattenError);
            if (attempt === MAX_FLATTEN_ATTEMPTS) {
              console.warn("All flatten attempts failed, using raw AI cover");
            }
          }
        }
        
        // Save the new cover URL (flattened if successful, raw if not)
        const finalCoverUrl = flattenedCoverUrl || data.personalizedCoverUrl;
        const updatedPersonalization = {
          ...personalization,
          personalizedCoverUrl: finalCoverUrl
        };
        
        // Update state and localStorage
        setPersonalization(updatedPersonalization);
        localStorage.setItem("personalizationData", JSON.stringify(updatedPersonalization));
        
        toast({
          title: "✨ Cover regenerated!",
          description: `${personalization.heroName}'s new cover is ready.`,
          className: "bg-success text-success-foreground",
        });
      }
    } catch (error) {
      console.error("Cover regeneration error:", error);
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
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
      <GenerationLoadingModal 
        isOpen={isRegenerating} 
        heroName={personalization?.heroName || "your hero"} 
      />
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl">Did you complete sharing?</AlertDialogTitle>
            <AlertDialogDescription>
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
            <CardTitle className="text-3xl md:text-4xl text-center font-heading">
              ✨ See the Magic
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {personalization.heroName}'s adventure in "{personalizeSimpleText(selectedStory.title)}"
            </p>
          </CardHeader>
        </Card>

        {/* Two-column layout: Cover left, Story pages right */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* LEFT COLUMN: Cover Image */}
          <Card className="border-2 border-secondary shadow-xl bg-secondary/20">
            <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {personalization.heroName}'s Cover
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl"></div>
                
                {/* Cover image with frame */}
                <div className="relative rounded-2xl overflow-hidden border-4 border-primary/40 shadow-2xl">
                  <img 
                    src={personalization.personalizedCoverUrl}
                    alt={`${personalization.heroName}'s magical adventure`}
                    className="w-full aspect-[4/3] object-cover block"
                  />
                  
                  {/* Watermark overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <p className="absolute top-[10%] left-[5%] text-4xl font-bold text-white/20 rotate-[-25deg] select-none">PREVIEW</p>
                    <p className="absolute top-[15%] right-[8%] text-3xl font-bold text-white/20 rotate-[20deg] select-none">PREVIEW</p>
                    <p className="absolute bottom-[12%] left-[10%] text-3xl font-bold text-white/20 rotate-[15deg] select-none">PREVIEW</p>
                  </div>
                </div>
              </div>
              
              {/* Caption */}
              <p className="text-center mt-4 font-heading font-semibold text-lg text-primary">
                {personalizeSimpleText(selectedStory.title)}
              </p>
              <p className="text-center mt-1 text-sm text-muted-foreground">
                Full 12-page storybook without watermark delivered after purchase
              </p>
              
              {/* Regenerate Cover Button */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateCover}
                  disabled={isRegenerating}
                  className="w-full border-primary/30 hover:border-primary hover:bg-primary/5"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                  Regenerate Cover Image
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Not happy with the cover? Try generating a new one!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT COLUMN: Story Preview (Pages 1-3) */}
          <Card className="border-2 border-accent/50 shadow-xl bg-gradient-to-br from-accent/5 to-background">
            <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Story Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sneak peek of the first 3 pages
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pages 1-3 with compact styling */}
              {storyPages.slice(0, 3).map((page: any, index: number) => (
                <div 
                  key={index}
                  className="bg-background/95 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <h3 className="text-sm font-heading font-semibold text-primary mb-2">
                    Page {page.page}
                  </h3>
                  <p className="text-sm leading-relaxed">
                    {renderPersonalizedText(page.text)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Share Card - Full Width */}
        <Card className="border-2 border-accent/50 shadow-xl bg-gradient-to-br from-accent/10 to-primary/5 hover:shadow-2xl hover:border-accent transition-all duration-300 mb-8">
          <CardHeader>
              <CardTitle className="text-xl font-heading flex items-center gap-2">
              <Share2 className="w-5 h-5 text-accent" />
              Share & Save
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {discountApplied ? (
              <div className="p-8 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border-2 border-success text-center space-y-3">
                <Sparkles className="w-16 h-16 text-success mx-auto animate-pulse" />
              <div>
                <p className="text-success font-bold text-xl mb-2 font-heading">
                  🎉 Discount Unlocked!
                </p>
                <p className="text-sm text-muted-foreground">
                  10% off will be applied at checkout
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  9 more magical pages await in the full storybook!
                </p>
              </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-center text-foreground leading-relaxed">
                    ✨ 9 more magical pages await! Share {personalization.heroName}'s story preview to unlock a <span className="font-bold text-primary">special 10% discount!</span>
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