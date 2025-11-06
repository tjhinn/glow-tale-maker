import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";

const stories = [
  {
    id: 1,
    title: "The Brave Little Explorer",
    summary: "Join our hero on an adventure through enchanted forests and magical mountains.",
    moral: "Courage grows when we face our fears with an open heart.",
    gradient: "from-accent/20 to-primary/20",
  },
  {
    id: 2,
    title: "The Kindness Quest",
    summary: "A heartwarming journey where small acts of kindness create big magic.",
    moral: "The greatest power in the world is kindness.",
    gradient: "from-secondary/40 to-accent/20",
  },
  {
    id: 3,
    title: "Mystery of the Golden Key",
    summary: "Solve riddles and discover treasures in a land of wonder and mystery.",
    moral: "Curiosity and wisdom open doors to amazing discoveries.",
    gradient: "from-primary/20 to-secondary/30",
  },
  {
    id: 4,
    title: "The Friendship Adventure",
    summary: "A tale of teamwork, laughter, and the magic of true friendship.",
    moral: "Together, we can achieve anything.",
    gradient: "from-accent/30 to-primary/10",
  },
];

const StorySelection = () => {
  const navigate = useNavigate();
  const [selectedStory, setSelectedStory] = useState<number | null>(null);

  const handleContinue = () => {
    if (selectedStory) {
      localStorage.setItem("selectedStory", JSON.stringify(stories.find(s => s.id === selectedStory)));
      navigate("/preview");
    }
  };

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Card className="shadow-2xl border-2 border-primary/20 mb-8 relative overflow-hidden">
          <SparklesAnimation count={6} className="opacity-30" />
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20 relative">
            <CardTitle className="text-3xl md:text-4xl text-center font-playfair">
              Choose your adventure!
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground font-poppins mt-2">
              Pick the perfect tale for your little hero
            </p>
          </CardHeader>
        </Card>

        {/* Stories Grid */}
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
              <CardHeader className={`bg-gradient-to-br ${story.gradient} rounded-t-lg relative overflow-hidden`}>
                {selectedStory === story.id && (
                  <SparklesAnimation count={3} className="opacity-50" />
                )}
                <CardTitle className="text-2xl font-playfair text-center relative">
                  {story.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold font-poppins mb-2">Story:</h4>
                  <p className="text-sm text-muted-foreground font-poppins leading-relaxed">{story.summary}</p>
                </div>
                <div>
                  <h4 className="font-semibold font-poppins mb-2">Moral:</h4>
                  <p className="text-sm text-muted-foreground italic font-poppins">{story.moral}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
