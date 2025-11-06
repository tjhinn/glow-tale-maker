import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import sample1 from "@/assets/sample-story-1.jpg";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const hasDiscount = localStorage.getItem("shareDiscount") === "true";
  
  const basePrice = 29.99;
  const discount = hasDiscount ? basePrice * 0.1 : 0;
  const finalPrice = basePrice - discount;

  const [formData, setFormData] = useState({
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handlePayment = async () => {
    if (!formData.email || !formData.cardNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all payment details.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      
      // Success confetti effect
      toast({
        title: "🎉 Payment Successful!",
        description: "Your magical storybook is being prepared!",
        className: "bg-success text-success-foreground",
      });
      
      navigate("/thank-you");
    }, 2000);
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
                  src={sample1}
                  alt="Story cover preview"
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary/30 rotate-[-5deg]">
                    <p className="text-lg font-bold text-muted-foreground">WATERMARK</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Full 24-page storybook without watermark delivered after purchase
              </p>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="border-2 border-secondary shadow-xl bg-gradient-to-br from-secondary/30 to-primary/10 hover:glow-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-poppins flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary animate-sparkle" />
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
                    You saved ${discount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Price Display */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className={hasDiscount ? "line-through text-muted-foreground" : "font-bold"}>
                    ${basePrice.toFixed(2)}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-success">Discount:</span>
                    <span className="text-success font-semibold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-primary">${finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Your storybook will be sent here
                </p>
              </div>

              {/* Card Details */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={formData.expiry}
                    onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={formData.cvc}
                    onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                  />
                </div>
              </div>

              {/* Pay Button */}
              <Button
                variant="magical"
                size="xl"
                onClick={handlePayment}
                disabled={processing}
                className="w-full animate-glow-pulse group"
              >
                {processing ? (
                  <>✨ Processing your magic...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
                    Pay Securely ${finalPrice.toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground font-poppins">
                🔒 Secure payment processing • Your data is protected
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
