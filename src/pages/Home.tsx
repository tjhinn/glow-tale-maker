import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";
import sample1 from "@/assets/sample-story-1.jpg";
import sample2 from "@/assets/sample-story-2.jpg";

const reviews = [
  {
    name: "Sarah M.",
    text: "My daughter was absolutely thrilled to see herself as the hero! The quality is stunning.",
    rating: 5,
  },
  {
    name: "Michael T.",
    text: "Best gift I've ever given. The personalization makes it so special and unique.",
    rating: 5,
  },
  {
    name: "Emily R.",
    text: "The illustrations are beautiful and the story had my son captivated from start to finish!",
    rating: 5,
  },
  {
    name: "David K.",
    text: "Worth every penny. My kids ask to read their fairy tale every single night.",
    rating: 5,
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-md border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            YourFairyTale.ai
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
              <Sparkles className="w-4 h-4 text-accent animate-sparkle" />
              <span className="text-sm font-medium text-accent">Create Magic in Minutes</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Every Child Deserves to Be{" "}
              <span className="text-primary animate-sparkle">The Hero</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a personalized 24-page illustrated storybook starring your child.
              A magical keepsake they'll treasure forever.
            </p>

            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/create")}
              className="mt-8 animate-glow-pulse"
            >
              <Sparkles className="w-5 h-5" />
              Start Your Fairy Tale
            </Button>
          </div>
        </div>
      </section>

      {/* Story Samples Carousel */}
      <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ✨ Magical Illustrations
          </h3>
          
          <Carousel className="max-w-5xl mx-auto">
            <CarouselContent>
              <CarouselItem className="md:basis-1/2">
                <Card className="border-2 border-primary/20 shadow-xl">
                  <CardContent className="p-0">
                    <img
                      src={sample1}
                      alt="Story illustration sample 1"
                      className="w-full h-auto rounded-lg"
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2">
                <Card className="border-2 border-accent/20 shadow-xl">
                  <CardContent className="p-0">
                    <img
                      src={sample2}
                      alt="Story illustration sample 2"
                      className="w-full h-auto rounded-lg"
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* Reviews Carousel */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            💛 Loved by Parents Everywhere
          </h3>
          
          <Carousel className="max-w-4xl mx-auto">
            <CarouselContent>
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full bg-card/80 backdrop-blur border-primary/10">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed">"{review.text}"</p>
                      <p className="text-sm font-semibold text-muted-foreground">
                        — {review.name}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-t from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <Button
            variant="hero"
            size="xl"
            onClick={() => navigate("/create")}
            className="animate-glow-pulse"
          >
            Get Yours Now!
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 YourFairyTale.ai • Creating magical memories, one story at a time</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
