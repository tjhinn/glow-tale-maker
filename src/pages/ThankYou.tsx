import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Confetti } from "@/components/animations/Confetti";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import { supabase } from "@/integrations/supabase/client";
import sample1 from "@/assets/sample-story-1.jpg";
const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(false);
  const [heroName, setHeroName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [personalization, setPersonalization] = useState<any>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  
  // Replace placeholders in story text with personalization data
  const replaceStoryPlaceholders = (text: string) => {
    if (!text || !personalization) return text;
    return text
      .replace(/{heroName}/g, personalization.heroName || '')
      .replace(/{petName}/g, personalization.petName || '')
      .replace(/{petType}/g, personalization.petType || '')
      .replace(/{favoriteColor}/g, personalization.favoriteColor || '')
      .replace(/{favoriteFood}/g, personalization.favoriteFood || '')
      .replace(/{city}/g, personalization.city || '');
  };
  
  useEffect(() => {
    setShowConfetti(true);
    
    const fetchOrderData = async () => {
      try {
        // Try to get order_id from URL params
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('order_id');
        
        if (orderId) {
          // Fetch order from database
          const { data: order, error } = await supabase
            .from('orders')
            .select('personalization_data, story_id')
            .eq('id', orderId)
            .single();
          
          if (!error && order) {
            const personalizationData = order.personalization_data as any;
            setHeroName(personalizationData?.heroName || "your little hero");
            setPersonalization(personalizationData);
            
            // Fetch the story using story_id
            if (order.story_id) {
              const { data: story } = await supabase
                .from('stories')
                .select('id, title, moral')
                .eq('id', order.story_id)
                .single();
              
              if (story) {
                setSelectedStory(story);
              }
            }
          } else {
            // Fallback to localStorage if database fetch fails
            tryLocalStorage();
          }
        } else {
          // No order_id in URL, use localStorage
          tryLocalStorage();
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        tryLocalStorage();
      } finally {
        setLoading(false);
      }
    };
    
    const tryLocalStorage = () => {
      const savedData = localStorage.getItem("personalizationData");
      const storyData = localStorage.getItem("selectedStory");
      
      if (savedData) {
        const data = JSON.parse(savedData);
        setHeroName(data?.heroName || "your little hero");
        setPersonalization(data);
      } else {
        setHeroName("your little hero");
      }
      
      if (storyData) {
        setSelectedStory(JSON.parse(storyData));
      }
    };
    
    fetchOrderData();
    
    // Clear localStorage after 5 seconds
    const clearTimer = setTimeout(() => {
      localStorage.removeItem("personalizationData");
      localStorage.removeItem("selectedStory");
      localStorage.removeItem("shareDiscount");
      localStorage.removeItem("orderId");
    }, 5000);
    
    return () => clearTimeout(clearTimer);
  }, [location]);
  const handleBackHome = () => {
    navigate("/");
  };
  return <PageWrapper>
      <Confetti active={showConfetti} count={150} />
      <SparklesAnimation count={12} className="opacity-40" />
      
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {loading ? (
          <Card className="shadow-2xl border-2 border-primary/30 mb-8">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg text-muted-foreground font-poppins">
                Loading your magical confirmation...
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
        {/* Success Message */}
        <Card className="shadow-2xl border-4 border-success mb-8 bg-gradient-to-br from-success/5 to-primary/5 relative overflow-hidden glow-soft">
          <SparklesAnimation count={8} className="opacity-30" />
          <CardHeader className="text-center space-y-6 py-12 relative">
            <div className="flex justify-center">
              <Sparkles className="w-20 h-20 text-success animate-sparkle" />
            </div>
            <CardTitle className="text-4xl md:text-5xl font-wonderia text-success leading-tight">
              ✨ The magic is brewing! ✨
            </CardTitle>
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-2xl text-foreground font-poppins">
                {heroName}'s adventure is being crafted with love
              </p>
              <p className="text-lg text-muted-foreground font-poppins leading-relaxed">
                Our fairy tale artists are illustrating every page of this magical story. You will receive a personalized storybook via email within 24 hours. The wait will be worth it!
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Preview Sneak Peek */}
        <Card className="shadow-xl border-2 border-primary/30 mb-8 hover:glow-primary transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20">
            <CardTitle className="text-2xl text-center font-wonderia">
              A Sneak Peek at the Magic
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <div className="mb-6 relative group max-w-md mx-auto">
              <img 
                src={personalization?.personalizedCoverUrl || sample1} 
                alt="Preview of your personalized storybook cover featuring your child as the hero" 
                className="w-full aspect-[4/3] object-cover block rounded-lg shadow-2xl group-hover:scale-105 transition-transform duration-500" 
              />
              
              {/* Title is now baked into the image - no overlay needed */}
              
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
            
            <p className="text-base text-muted-foreground font-poppins">
              ✨ Watch your inbox! Your completed storybook will arrive within 24 hours.
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="magical" size="lg" onClick={handleBackHome} className="group">
            <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
            Create Another Fairy Tale
          </Button>
          <p className="text-xs text-muted-foreground font-poppins mt-4">
            ✨ Ready to craft more magical memories?
          </p>
        </div>
        </>
        )}
      </div>
    </PageWrapper>;
};
export default ThankYou;