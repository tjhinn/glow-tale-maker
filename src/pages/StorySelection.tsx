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

      // Generate illustrated character if not already done
      if (personalization.heroPhotoUrl && !personalization.illustratedCharacterUrl) {
        toast({
          title: `Bringing ${personalization.heroName} into the story... ✨`,
          description: `Styling in ${story.illustration_style} style!`
        });
        const {
          data,
          error
        } = await supabase.functions.invoke('generate-character-illustration', {
          body: {
            heroPhotoUrl: personalization.heroPhotoUrl,
            petType: personalization.petType,
            petName: personalization.petName,
            favoriteColor: personalization.favoriteColor,
            favoriteFood: personalization.favoriteFood,
            illustrationStyle: story.illustration_style
          }
        });
        if (error) {
          console.error("Character illustration error:", error);
          toast({
            title: "Character generation failed",
            description: error.message || "Please try again later.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        if (data?.illustratedCharacterUrl) {
          // Update personalization data with illustrated character
          const updatedPersonalization = {
            ...personalization,
            illustratedCharacterUrl: data.illustratedCharacterUrl
          };
          localStorage.setItem("personalizationData", JSON.stringify(updatedPersonalization));
          toast({
            title: "Character ready! ✨",
            description: `${personalization.heroName} looks perfect in this story!`
          });
        }
      }

      // Save selected story
      localStorage.setItem("selectedStory", JSON.stringify({
        ...story,
        cover_image_url: fullCoverUrl
      }));
      navigate("/preview");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
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
              {personalization.illustratedCharacterUrl && <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-full opacity-30 blur-lg group-hover:opacity-50 transition-all duration-300"></div>
                  <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/40 shadow-2xl ring-4 ring-accent/20 hover:scale-105 transition-transform duration-300">
                    <img src={personalization.illustratedCharacterUrl} alt={personalization.heroName} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>}
              <div className="space-y-2">
                <CardTitle className="text-3xl md:text-4xl font-playfair">
                  Choose {personalization.heroName}'s Adventure!
                </CardTitle>
                <p className="text-sm text-muted-foreground font-poppins">
                  Pick the perfect tale for our {personalization.gender === 'boy' ? 'brave hero' : 'amazing hero'}, {personalization.heroName}
                  {personalization.petName && ` and ${personalization.petName}`}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stories Grid */}
        {isLoadingStories ? <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-poppins">Loading magical stories...</p>
          </div> : !stories || stories.length === 0 ? <div className="text-center py-12">
            <p className="text-muted-foreground font-poppins">No stories available for this hero.</p>
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
                    <CardTitle className="text-2xl font-playfair text-center relative">
                      {replaceStoryPlaceholders(story.title)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold font-poppins mb-2">Story Synopsis:</h4>
                    <p className="text-sm text-muted-foreground italic font-poppins">{replaceStoryPlaceholders(story.moral)}</p>
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
          <Button variant="magical" size="lg" onClick={handleContinue} disabled={selectedStory === null} className="flex-1 group">
            <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
            See the Magic
          </Button>
        </div>
      </div>
    </PageWrapper>;
};
export default StorySelection;