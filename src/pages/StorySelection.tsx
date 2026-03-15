import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GenerationLoadingModal } from "@/components/story/GenerationLoadingModal";
import { startCoverGeneration, pollForCoverCompletion } from "@/lib/coverGenerationPolling";
import { getColorValue } from "@/lib/colorUtils";

const StorySelection = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [personalization, setPersonalization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load personalization data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("personalizationData");
    if (!savedData) {
      toast({
        title: "Missing information",
        description: "Please complete the personalization form first.",
        variant: "destructive"
      });
      navigate("/create");
      return;
    }
    setPersonalization(JSON.parse(savedData));
  }, [navigate, toast]);

  // Fetch stories filtered by hero gender
  const {
    data: stories,
    isLoading: isLoadingStories
  } = useQuery({
    queryKey: ['stories', personalization?.gender],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('stories').select('*').eq('is_active', true).or(`hero_gender.eq.${personalization?.gender},hero_gender.eq.both`);
      if (error) throw error;
      return data;
    },
    enabled: !!personalization?.gender
  });

  // Dynamically load Google Fonts for story titles
  useEffect(() => {
    if (!stories) return;
    
    const fonts = [...new Set(stories.map(s => s.title_font || 'Fredoka'))];
    
    fonts.forEach(font => {
      const fontName = font.replace(/ /g, '+');
      const linkId = `google-font-${fontName}`;
      
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [stories]);
  const handleContinue = async () => {
    if (!selectedStory || !stories) return;
    const story = stories.find(s => s.id === selectedStory);
    if (!story) return;
    setIsLoading(true);
    try {
      // Convert storage path to full public URL for cover
      let fullCoverUrl = story.cover_image_url;
      if (fullCoverUrl && !fullCoverUrl.startsWith('http')) {
        const {
          data
        } = supabase.storage.from('story-images').getPublicUrl(fullCoverUrl);
        fullCoverUrl = data.publicUrl;
      }

      // Generate personalized cover for the selected story
      if (personalization.heroPhotoUrl) {
        // Prepare personalized title
        const personalizedTitle = replaceStoryPlaceholders(story.title);
        
        // Debug logging for gender parameter
        console.log("Personalization gender value:", personalization.gender);
        console.log("Full personalization object:", personalization);
        
        // Start generation job and poll for completion
        let data: { personalizedCoverUrl?: string } | undefined;
        try {
          // Start the job (returns immediately with job ID)
          const jobId = await startCoverGeneration({
            heroPhotoUrl: personalization.heroPhotoUrl,
            coverImageUrl: fullCoverUrl,
            personalizedTitle: personalizedTitle,
            petType: personalization.petType,
            petName: personalization.petName,
            favoriteColor: personalization.favoriteColor,
            illustrationStyle: story.illustration_style,
            heroGender: personalization.gender,
            storyTheme: story.moral,
          });
          
          console.log("Cover generation job started:", jobId);
          
          // Poll for completion (up to 3 minutes)
          const result = await pollForCoverCompletion(jobId, {
            maxAttempts: 60,
            intervalMs: 3000,
            onStatusChange: (status) => console.log("Generation status:", status)
          });
          
          data = { personalizedCoverUrl: result.personalizedCoverUrl };
        } catch (genError: unknown) {
          console.error("Personalized cover generation error:", genError);
          toast({
            title: "Cover generation failed",
            description: genError instanceof Error ? genError.message : "Please try again later.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        if (data?.personalizedCoverUrl) {
          // Import utilities
          const { flattenCoverWithTitle } = await import("@/lib/flattenCoverWithTitle");
          const { enforceAspectRatio } = await import("@/lib/enforceAspectRatio");
          
          let flattenedCoverUrl: string | null = null;
          const MAX_FLATTEN_ATTEMPTS = 2;
          
          for (let attempt = 1; attempt <= MAX_FLATTEN_ATTEMPTS; attempt++) {
            try {
              console.log(`Cover flattening attempt ${attempt}/${MAX_FLATTEN_ATTEMPTS}...`);
              
              // Enforce 4:3 aspect ratio (safety net in case AI doesn't respect parameter)
              const aspectRatioCorrectedUrl = await enforceAspectRatio(data.personalizedCoverUrl);
              
              // Get the title font and color from the story (with fallbacks)
              const titleFont = (story as any).title_font || 'Fredoka';
              const titleColor = (story as any).title_color || '#FFD700';
              
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
              
              // Verify the upload exists
              const { data: verifyData } = await supabase.storage
                .from('hero-photos')
                .list('', { search: fileName });
              
              if (!verifyData || verifyData.length === 0) {
                throw new Error("Upload verification failed - file not found");
              }
              
              // Get public URL of the flattened image
              const { data: urlData } = supabase.storage
                .from('hero-photos')
                .getPublicUrl(fileName);
              
              flattenedCoverUrl = urlData.publicUrl;
              console.log("Flattened cover with title uploaded and verified:", flattenedCoverUrl);
              break; // Success, exit retry loop
              
            } catch (flattenError) {
              console.error(`Flatten attempt ${attempt} failed:`, flattenError);
              if (attempt === MAX_FLATTEN_ATTEMPTS) {
                console.warn("All flatten attempts failed, using raw AI cover");
              }
            }
          }
          
          // Save the cover URL (flattened if successful, raw if not)
          const finalCoverUrl = flattenedCoverUrl || data.personalizedCoverUrl;
          const updatedPersonalization = {
            ...personalization,
            personalizedCoverUrl: finalCoverUrl
          };
          localStorage.setItem("personalizationData", JSON.stringify(updatedPersonalization));
          
          // Verify localStorage was updated correctly
          const verifiedData = JSON.parse(localStorage.getItem("personalizationData") || "{}");
          console.log("Verified localStorage cover URL:", verifiedData.personalizedCoverUrl);
          
          if (!flattenedCoverUrl) {
            toast({
              title: "Using simplified cover",
              description: "Title overlay unavailable, but your story is ready!",
            });
          }
        }
      }

      // Save selected story
      localStorage.setItem("selectedStory", JSON.stringify({
        ...story,
        cover_image_url: fullCoverUrl
      }));
      navigate("/preview");
    } catch (error) {
      console.error("Cover generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Replace placeholders in story text with personalization data
  const replaceStoryPlaceholders = (text: string) => {
    if (!text || !personalization) return text;
    return text.replace(/{heroName}/g, personalization.heroName || '').replace(/{petName}/g, personalization.petName || '').replace(/{petType}/g, personalization.petType || '').replace(/{favoriteColor}/g, personalization.favoriteColor || '').replace(/{favoriteFood}/g, personalization.favoriteFood || '').replace(/{city}/g, personalization.city || '');
  };
  if (!personalization) {
    return null;
  }
  return <PageWrapper>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Hero Card with Photo */}
        <Card className="shadow-2xl border-2 border-primary/20 mb-8 relative overflow-hidden">
          <SparklesAnimation count={8} className="opacity-30" />
          <CardHeader className="bg-gradient-to-br from-accent/30 via-primary/20 to-secondary/30 relative">
            <div className="flex flex-col items-center gap-6 text-center">
              {personalization.personalizedCoverUrl && <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-full opacity-30 blur-lg group-hover:opacity-50 transition-all duration-300"></div>
                  <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/40 shadow-2xl ring-4 ring-accent/20 hover:scale-105 transition-transform duration-300">
                    <img src={personalization.personalizedCoverUrl} alt={personalization.heroName} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>}
              <div className="space-y-2">
                <CardTitle className="text-3xl md:text-4xl font-heading">
                  Choose {personalization.heroName}'s Adventure!
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick the perfect tale for our amazing hero, {personalization.heroName}
                  {personalization.petName ? ` and ${personalization.gender === 'boy' ? 'his' : 'her'} trusty companion, ${personalization.petName}!` : '!'}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stories Grid */}
        {isLoadingStories ? <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading magical stories...</p>
          </div> : !stories || stories.length === 0 ? <div className="text-center py-12">
            <p className="text-muted-foreground">No stories available for this hero.</p>
          </div> : <div className="grid md:grid-cols-2 gap-6 mb-8">
            {stories.map(story => {
              // Convert storage path to public URL for cover image
              let coverUrl = story.cover_image_url;
              if (coverUrl && !coverUrl.startsWith('http')) {
                const { data } = supabase.storage.from('story-images').getPublicUrl(coverUrl);
                coverUrl = `${data.publicUrl}?t=${new Date(story.updated_at).getTime()}`;
              }

              return <Card key={story.id} onClick={() => setSelectedStory(story.id)} className={`
                  cursor-pointer transition-all duration-300 page-turn
                  ${selectedStory === story.id ? "border-4 border-primary shadow-xl ring-4 ring-primary/30 bg-primary/5" : "border-2 border-border hover:border-primary/50 hover:shadow-lg"}
                `}>
                <CardHeader className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-t-lg relative overflow-hidden p-0">
                  {selectedStory === story.id && <SparklesAnimation count={3} className="opacity-50" />}
                  {coverUrl && (
                    <div className="w-full h-64 overflow-hidden bg-muted/20">
                      <img 
                        src={coverUrl} 
                        alt={replaceStoryPlaceholders(story.title)}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <CardTitle 
                      className="text-3xl text-center"
                      style={{
                        fontFamily: "'Bubblegum Sans', cursive",
                        color: getColorValue(personalization.favoriteColor) || 'inherit'
                      }}
                    >
                      {replaceStoryPlaceholders(story.title)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold font-heading mb-2">Story Synopsis:</h4>
                    <p className="text-sm text-muted-foreground italic">{replaceStoryPlaceholders(story.moral)}</p>
                  </div>
                </CardContent>
              </Card>;
            })}
          </div>}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={() => navigate("/create")} className="flex-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button 
            variant="magical" 
            size="lg" 
            onClick={handleContinue} 
            disabled={selectedStory === null || isLoading} 
            className="flex-1 group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Magic...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
                See the Magic
              </>
            )}
          </Button>
        </div>
      </div>

      <GenerationLoadingModal 
        isOpen={isLoading} 
        heroName={personalization.heroName} 
      />
    </PageWrapper>;
};
export default StorySelection;