import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-md border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            YourFairyTale.ai
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <Card className="shadow-2xl border-2 border-accent/30 mb-8">
          <CardHeader className="bg-gradient-to-r from-accent/30 to-primary/20 border-b-4 border-accent/50">
            <CardTitle className="text-3xl md:text-4xl text-center font-bold">
              Choose Your Story
            </CardTitle>
            <CardDescription className="text-center text-base">
              Select a magical adventure for your hero
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stories.map((story) => (
            <Card
              key={story.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedStory === story.id
                  ? "ring-4 ring-accent shadow-2xl glow-accent"
                  : "hover:shadow-xl"
              }`}
              onClick={() => setSelectedStory(story.id)}
            >
              <CardHeader className={`bg-gradient-to-br ${story.gradient} border-b border-primary/10`}>
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  {selectedStory === story.id && (
                    <Sparkles className="w-5 h-5 text-accent animate-sparkle" />
                  )}
                  Story Option {story.id}
                </CardTitle>
                <CardDescription className="font-bold text-lg text-foreground">
                  {story.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm leading-relaxed">{story.summary}</p>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Moral of the Story
                  </p>
                  <p className="text-sm italic text-accent font-medium">{story.moral}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 max-w-3xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/create")}
            className="flex-1 border-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="hero"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedStory}
            className="flex-1"
          >
            Continue to Next Step
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StorySelection;
