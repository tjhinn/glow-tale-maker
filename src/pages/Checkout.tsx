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

// Declare Midtrans Snap on window object
declare global {
  interface Window {
    snap: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const hasDiscount = localStorage.getItem("shareDiscount") === "true";
  
  const basePrice = 149000; // IDR 149,000 (~$10 USD)
  const discount = hasDiscount ? basePrice * 0.1 : 0;
  const finalPrice = basePrice - discount;

  useEffect(() => {
    // Load Midtrans Snap script
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    // Get client key from environment variable
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "SB-Mid-client-REPLACE_WITH_YOUR_KEY";
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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

      // Call edge function to create Midtrans payment
      const { data, error } = await supabase.functions.invoke("create-midtrans-payment", {
        body: {
          userEmail: email,
          amount: Math.round(finalPrice),
          discountApplied: hasDiscount,
          discountCode: hasDiscount ? "SHARE10" : undefined,
          personalizationData,
          storyId: selectedStory.id,
        },
      });

      if (error) {
        console.error("Error creating payment:", error);
        throw error;
      }

      console.log("Payment data received:", data);

      // Open Midtrans Snap payment page
      if (window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: function (result: any) {
            console.log("Payment success:", result);
            localStorage.setItem("orderId", data.orderId);
            toast({
              title: "🎉 Payment Successful!",
              description: "Your magical storybook is being prepared!",
              className: "bg-success text-success-foreground",
            });
            navigate("/thank-you");
          },
          onPending: function (result: any) {
            console.log("Payment pending:", result);
            toast({
              title: "Payment Pending",
              description: "We're waiting for your payment confirmation.",
            });
            setProcessing(false);
          },
          onError: function (result: any) {
            console.error("Payment error:", result);
            toast({
              title: "Payment Failed",
              description: "Please try again or contact support.",
              variant: "destructive",
            });
            setProcessing(false);
          },
          onClose: function () {
            console.log("Payment popup closed");
            setProcessing(false);
          },
        });
      } else {
        throw new Error("Midtrans Snap is not loaded");
      }
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
                    You saved Rp {discount.toLocaleString("id-ID")}
                  </p>
                </div>
              )}

              {/* Price Display */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className={hasDiscount ? "line-through text-muted-foreground" : "font-bold"}>
                    Rp {basePrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-success">Discount:</span>
                    <span className="text-success font-semibold">-Rp {discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-primary">Rp {finalPrice.toLocaleString("id-ID")}</span>
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
                className="w-full animate-glow-pulse group"
              >
                {processing ? (
                  <>✨ Processing your magic...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:animate-sparkle" />
                    Pay Securely Rp {finalPrice.toLocaleString("id-ID")}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground font-poppins">
                🔒 Powered by Midtrans • Secure payment processing
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
