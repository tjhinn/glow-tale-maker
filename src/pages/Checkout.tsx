import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { supabase } from "@/integrations/supabase/client";
import sample1 from "@/assets/sample-story-1.jpg";


const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const [personalization, setPersonalization] = useState<any>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const hasDiscount = localStorage.getItem("shareDiscount") === "true";
  
  const basePrice = 999; // $9.99 USD in cents
  const discount = hasDiscount ? Math.round(basePrice * 0.1) : 0;
  const finalPrice = basePrice - discount;

  // Load personalization and story data
  useEffect(() => {
    const personalizationData = localStorage.getItem("personalizationData");
    const storyData = localStorage.getItem("selectedStory");
    
    if (personalizationData) {
      setPersonalization(JSON.parse(personalizationData));
    }
    if (storyData) {
      setSelectedStory(JSON.parse(storyData));
    }
  }, []);

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

  const handlePayment = async () => {
    if (!email) {
      toast({
        title: "Missing information",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    try {
      const personalizationData = JSON.parse(localStorage.getItem("personalizationData") || "{}");
      const selectedStory = JSON.parse(localStorage.getItem("selectedStory") || "{}");

      // Ensure we're using the correct field names for backwards compatibility
      const paymentData = {
        ...personalizationData,
        // Map old photoUrl to new structure if needed
        originalPhotoUrl: personalizationData.originalPhotoUrl || personalizationData.photoUrl,
      };

      // Call edge function to create LemonSqueezy checkout
      const { data, error } = await supabase.functions.invoke("create-lemonsqueezy-checkout", {
        body: {
          userEmail: email,
          amount: finalPrice,
          discountApplied: hasDiscount,
          discountCode: hasDiscount ? "SHARE10" : undefined,
          personalizationData: paymentData,
          storyId: selectedStory.id,
        },
      });

      if (error) {
        console.error("Error creating checkout:", error);
        throw error;
      }

      // Store order ID for thank you page
      localStorage.setItem("orderId", data.orderId);

      // Redirect to LemonSqueezy hosted checkout
      window.location.href = data.checkoutUrl;
      
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <Card className="shadow-2xl border-2 border-accent/30 mb-8 relative overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/30 to-primary/20">
            <CardTitle className="text-3xl md:text-4xl text-center font-playfair">
              Almost there — your story's about to come alive
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground font-poppins mt-2">
              Complete your purchase and receive your magical storybook
            </p>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview */}
          <Card className="border-2 border-secondary shadow-xl bg-secondary/20 hover:glow-soft transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-poppins">Your Storybook Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <img
                  src={personalization?.personalizedCoverUrl || sample1}
                  alt="Story cover preview"
                  className="w-full rounded-lg shadow-lg"
                />
                
                {/* Code-based title overlay - pixel perfect typography */}
                {personalization?.personalizedCoverUrl && selectedStory && (
                  <div className="absolute top-[8%] left-0 right-0 px-6 pointer-events-none">
                    <h1 className="font-fredoka text-2xl sm:text-3xl md:text-4xl text-center leading-tight"
                        style={{
                          textShadow: '3px 3px 8px rgba(0,0,0,0.7), 0 0 20px rgba(255,139,0,0.5)',
                          color: '#FFE97F',
                          WebkitTextStroke: '2px rgba(0,0,0,0.3)'
                        }}>
                      {replaceStoryPlaceholders(selectedStory.title)}
                    </h1>
                  </div>
                )}
                
                {/* Watermark overlay - scattered for visibility */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Top-left watermark */}
                  <p className="absolute top-[10%] left-[5%] text-4xl font-bold text-white/20 rotate-[-25deg] select-none">
                    PREVIEW
                  </p>
                  {/* Top-right watermark */}
                  <p className="absolute top-[15%] right-[8%] text-3xl font-bold text-white/20 rotate-[20deg] select-none">
                    PREVIEW
                  </p>
                  {/* Bottom-left watermark */}
                  <p className="absolute bottom-[12%] left-[10%] text-3xl font-bold text-white/20 rotate-[15deg] select-none">
                    PREVIEW
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Full 12-page storybook without watermark delivered after purchase
              </p>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="border-2 border-secondary shadow-xl bg-gradient-to-br from-secondary/30 to-primary/10 hover:glow-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-poppins flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discount Badge */}
              {hasDiscount && (
                <div className="p-4 rounded-xl bg-success/10 border-2 border-success text-center glow-soft">
                  <Sparkles className="w-8 h-8 text-success mx-auto mb-2 animate-sparkle" />
                  <p className="text-success font-bold font-poppins">🎉 10% Discount Applied!</p>
                  <p className="text-sm text-success-foreground mt-1 font-poppins">
                    You saved ${(discount / 100).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Price Display */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className={hasDiscount ? "line-through text-muted-foreground" : "font-bold"}>
                    ${(basePrice / 100).toFixed(2)}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-success">Discount:</span>
                    <span className="text-success font-semibold">-${(discount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-primary">${(finalPrice / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your storybook will be sent here
                </p>
              </div>

              {/* Pay Button */}
              <Button
                variant="magical"
                size="xl"
                onClick={handlePayment}
                disabled={processing || !email}
                className="w-full group"
              >
                {processing ? (
                  <>✨ Redirecting to checkout...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
                    Pay Securely ${(finalPrice / 100).toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground font-poppins">
                🔒 Powered by LemonSqueezy • Secure global payment processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/preview")}
          >
            ← Back to Preview
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Checkout;
