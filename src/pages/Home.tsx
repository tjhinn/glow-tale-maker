import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Sparkles, Heart, BookOpen } from "lucide-react";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-illustration.jpg";
import Autoplay from "embla-carousel-autoplay";
const Home = () => {
  const navigate = useNavigate();
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  useEffect(() => {
    fetchCarouselImages();
    fetchReviews();
  }, []);
  const fetchCarouselImages = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      setCarouselImages(data || []);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
    } finally {
      setLoadingImages(false);
    }
  };
  const fetchReviews = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('reviews').select('*').eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };
  return <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-primary/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            YourFairyTale.ai
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/5 via-background to-background">
        <SparklesAnimation count={8} />
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{
        backgroundImage: `url(${heroImage})`
      }} />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            
            
            <h2 className="text-5xl md:text-7xl font-bold font-heading leading-tight">
              Every Child Deserves to Be{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-sparkle">
The Hero</span>
            </h2>
            
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create a personalized 12-page illustrated storybook starring your child.
              A magical keepsake they'll treasure forever.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button variant="magical" size="xl" onClick={() => navigate("/create")} className="group text-3xl">
                <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
                Begin Your Story    
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-success fill-success" />
                <span>Loved by 10,000+ families</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Samples Carousel */}
      <section className="py-20 bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h3 className="text-4xl md:text-5xl font-bold font-heading">
                Magical Illustrations
              </h3>
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-xl">
              Every page is a masterpiece, personalized just for your child
            </p>
          </div>
          
          <Carousel className="max-w-5xl mx-auto" opts={{
          loop: true,
          align: "start"
        }} plugins={[Autoplay({
          delay: 4000,
          stopOnInteraction: true,
          stopOnMouseEnter: true
        })]}>
            <CarouselContent>
              {loadingImages ? <CarouselItem className="md:basis-1/2">
                  <Card className="border-2 border-primary/30 shadow-2xl">
                    <CardContent className="p-0 flex items-center justify-center h-96">
                      <p className="text-muted-foreground">Loading magical illustrations...</p>
                    </CardContent>
                  </Card>
                </CarouselItem> : carouselImages.length > 0 ? carouselImages.map((image, index) => <CarouselItem key={image.id} className="md:basis-1/2">
                    <Card className={`border-2 ${index % 2 === 0 ? 'border-primary/30 hover:shadow-primary/20' : 'border-accent/30 hover:shadow-accent/20'} shadow-2xl transition-all duration-300 page-turn overflow-hidden rounded-lg group`}>
                      <CardContent className="p-0 relative">
                        <img src={image.image_url} alt={image.alt_text} className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${index % 2 === 0 ? 'from-primary/20' : 'from-accent/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      </CardContent>
                    </Card>
                  </CarouselItem>) : <CarouselItem className="md:basis-1/2">
                  <Card className="border-2 border-primary/30 shadow-2xl">
                    <CardContent className="p-0 flex items-center justify-center h-96">
                      <p className="text-muted-foreground">No carousel images available</p>
                    </CardContent>
                  </Card>
                </CarouselItem>}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex hover:glow-primary" />
            <CarouselNext className="hidden md:flex hover:glow-primary" />
          </Carousel>
        </div>
      </section>

      {/* Reviews Carousel */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3 animate-fade-in">
            <h3 className="text-4xl md:text-5xl font-bold font-heading flex items-center justify-center gap-3">
              <Heart className="w-8 h-8 text-success fill-success" />
              Loved by Parents Everywhere
              <Heart className="w-8 h-8 text-success fill-success" />
            </h3>
            <p className="text-muted-foreground text-xl">
              Join thousands of families creating magical memories
            </p>
          </div>
          
          <Carousel className="max-w-6xl mx-auto" opts={{
          loop: true,
          align: "start"
        }} plugins={[Autoplay({
          delay: 5000,
          stopOnInteraction: true,
          stopOnMouseEnter: true
        })]}>
            <CarouselContent>
              {loadingReviews ? <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border-2 border-primary/10">
                    <CardContent className="p-6 flex items-center justify-center">
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </CardContent>
                  </Card>
                </CarouselItem> : reviews.length > 0 ? reviews.map((review, index) => <CarouselItem key={review.id || index} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full bg-gradient-to-br from-card to-secondary/5 backdrop-blur border-2 border-primary/10 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-primary text-primary" />)}
                        </div>
                        <p className="text-sm leading-relaxed italic text-foreground/90">
                          "{review.review_text}"
                        </p>
                        <p className="text-sm font-semibold text-muted-foreground">
                          — {review.reviewer_name}
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>) : <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border-2 border-primary/10">
                    <CardContent className="p-6 flex items-center justify-center">
                      <p className="text-muted-foreground">No reviews available</p>
                    </CardContent>
                  </Card>
                </CarouselItem>}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex hover:glow-accent" />
            <CarouselNext className="hidden md:flex hover:glow-accent" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
        <SparklesAnimation count={6} />
        <div className="container mx-auto px-4 text-center space-y-6">
          <h3 className="text-3xl font-bold font-heading md:text-5xl">
            Ready to Create Magic?
          </h3>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start your child's personalized adventure today
          </p>
          <Button variant="magical" size="xl" onClick={() => navigate("/create")} className="group text-3xl">
            <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
            Begin Your Story  
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-secondary/10">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <p className="text-lg font-semibold font-heading">YourFairyTale.ai</p>
          </div>
          <p className="text-muted-foreground text-lg">
            Creating magical memories, one story at a time
          </p>
          <p className="text-xs text-muted-foreground">
            © 2025 YourFairyTale.ai • All rights reserved
          </p>
        </div>
      </footer>
    </div>;
};
export default Home;