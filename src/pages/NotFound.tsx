import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Home } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Sparkles as SparklesAnimation } from "@/components/animations/Sparkles";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <Card className="shadow-2xl border-2 border-primary/30 relative overflow-hidden">
          <SparklesAnimation count={8} className="opacity-40" />
          <CardContent className="p-12 text-center space-y-6 relative">
            <div className="flex justify-center">
              <Sparkles className="w-20 h-20 text-accent" />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-playfair text-primary">
              404
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-playfair text-foreground">
              Oops! This page wandered into the enchanted forest...
            </h2>
            
            <p className="text-muted-foreground font-poppins max-w-md mx-auto">
              Don't worry, even the best fairy tales have unexpected twists. 
              Let's get you back on the path to magic!
            </p>
            
            <Button
              variant="magical"
              size="xl"
              onClick={() => navigate("/")}
              className="group mt-6"
            >
              <Home className="w-5 h-5 group-hover:animate-sparkle" />
              Return to Magical Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default NotFound;
