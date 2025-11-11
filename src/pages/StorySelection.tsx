import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, User } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StorySelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [personalization, setPersonalization] = useState<any>(null);

  // Load personalization data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("personalizationData");
    if (!savedData) {
      toast({
        title: "Missing information",
        description: "Please complete the personalization form first.",
        variant: "destructive",
      });
      navigate("/create");
      return;
    }
    setPersonalization(JSON.parse(savedData));
  }, [navigate, toast]);

  // Fetch stories filtered by hero gender
  const { data: stories, isLoading } = useQuery({
    queryKey: ['stories', personalization?.gender],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_active', true)
        .eq('hero_gender', personalization?.gender || 'boy');
      
      if (error) throw error;
      return data;
    },
    enabled: !!personalization?.gender
  });

  const handleContinue = () => {
    if (selectedStory && stories) {
      localStorage.setItem("selectedStory", JSON.stringify(stories.find(s => s.id === selectedStory)));
      navigate("/preview");
    }
  };

  if (!personalization) {
    return null;
  }

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Hero Card with Photo */}
        <Card className="shadow-2xl border-2 border-primary/20 mb-8 relative overflow-hidden">
          <SparklesAnimation count={6} className="opacity-30" />
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20 relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {personalization.photoUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg flex-shrink-0">
                  <img 
                    src={personalization.photoUrl} 
                    alt={personalization.heroName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center border-4 border-primary/30 shadow-lg flex-shrink-0">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="text-center md:text-left flex-1">
                <CardTitle className="text-3xl md:text-4xl font-playfair mb-2">
                  Choose {personalization.heroName}'s Adventure!
                </CardTitle>
                <p className="text-sm text-muted-foreground font-poppins">
                  Pick the perfect tale for our {personalization.gender === 'boy' ? 'brave hero' : 'amazing hero'}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-poppins">Loading magical stories...</p>
          </div>
        ) : !stories || stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-poppins">No stories available for this hero.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {stories.map((story) => (
              <Card
                key={story.id}
                onClick={() => setSelectedStory(story.id)}
                className={`
                  cursor-pointer transition-all duration-300 page-turn
                  ${selectedStory === story.id
                    ? "border-4 border-primary shadow-2xl scale-105 glow-primary"
                    : "border-2 border-border hover:border-primary/50 hover:shadow-xl hover:glow-soft"
                  }
                `}
              >
                <CardHeader className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-t-lg relative overflow-hidden">
                  {selectedStory === story.id && (
                    <SparklesAnimation count={3} className="opacity-50" />
                  )}
                  <CardTitle className="text-2xl font-playfair text-center relative">
                    {story.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold font-poppins mb-2">Moral:</h4>
                    <p className="text-sm text-muted-foreground italic font-poppins">{story.moral}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/create")}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="magical"
            size="lg"
            onClick={handleContinue}
            disabled={selectedStory === null}
            className="flex-1 group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
            See the Magic
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StorySelection;
