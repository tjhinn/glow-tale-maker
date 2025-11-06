import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Sparkles, Mail } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Confetti } from "@/components/animations/Confetti";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";
import sample1 from "@/assets/sample-story-1.jpg";

const ThankYou = () => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  const handleBackHome = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <PageWrapper>
      <Confetti active={showConfetti} count={150} />
      <SparklesAnimation count={12} className="opacity-40" />
      
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Success Message */}
        <Card className="shadow-2xl border-4 border-success mb-8 bg-gradient-to-br from-success/5 to-primary/5 relative overflow-hidden glow-soft">
          <SparklesAnimation count={8} className="opacity-30" />
          <CardHeader className="text-center space-y-4 pt-8 relative">
            <div className="flex justify-center">
              <Sparkles className="w-16 h-16 text-success animate-sparkle" />
            </div>
            <CardTitle className="text-4xl md:text-5xl font-playfair text-success">
              The magic is complete!
            </CardTitle>
            <p className="text-xl text-muted-foreground font-poppins">
              Your fairy tale is ready to enchant
            </p>
          </CardHeader>
        </Card>

        {/* Storybook Preview & Download */}
        <Card className="shadow-xl border-2 border-primary/30 mb-8 hover:glow-primary transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-accent/20 to-primary/20">
            <CardTitle className="text-2xl text-center font-playfair">
              Your Personalized Storybook
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <div className="mb-6 relative group">
              <img
                src={sample1}
                alt="Your completed personalized storybook cover featuring your child as the hero"
                className="w-full max-w-md mx-auto rounded-lg shadow-2xl group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            </div>
            
            <Button
              variant="magical"
              size="xl"
              onClick={() => alert("Download started!")}
              className="w-full sm:w-auto group"
            >
              <Download className="w-5 h-5 group-hover:animate-sparkle" />
              Download High-Res File
            </Button>
            
            <p className="text-sm text-muted-foreground font-poppins mt-4">
              ✨ Your storybook has also been sent to your email!
            </p>
          </CardContent>
        </Card>

        {/* Email Resend Section */}
        <Card className="shadow-lg border-2 border-secondary/50 mb-8 bg-secondary/10 hover:glow-accent transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-poppins flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              Didn't receive the email?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-poppins">
              Check your spam folder or click below to resend the download link.
            </p>
            <Button
              variant="outline"
              onClick={() => alert("Email resent!")}
              className="w-full sm:w-auto"
            >
              <Mail className="w-4 h-4" />
              Resend Email
            </Button>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button
            variant="magical"
            size="lg"
            onClick={handleBackHome}
            className="group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-sparkle" />
            Create Another Fairy Tale
          </Button>
          <p className="text-xs text-muted-foreground font-poppins mt-4">
            ✨ Ready to craft more magical memories?
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ThankYou;
