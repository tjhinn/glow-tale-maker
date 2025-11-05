import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Download, Mail } from "lucide-react";
import sample1 from "@/assets/sample-story-1.jpg";

const ThankYou = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    // In a real implementation, this would trigger the actual PDF download
    alert("Download functionality would be implemented here!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-accent/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-md border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            YourFairyTale.ai
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Success Header */}
        <Card className="shadow-2xl border-2 border-accent/30 mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/30 via-primary/20 to-success/20">
            <CardTitle className="text-3xl md:text-5xl text-center font-bold space-y-4">
              <div className="flex justify-center">
                <Sparkles className="w-16 h-16 text-primary animate-sparkle" />
              </div>
              <div>Thank You for Purchasing!</div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Storybook Preview */}
          <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-secondary/30 to-primary/10">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-center">Your Magical Storybook</h3>
              <img
                src={sample1}
                alt="Complete storybook cover"
                className="w-full rounded-lg shadow-lg"
              />
              <p className="text-center text-sm text-muted-foreground">
                24 beautifully illustrated pages, personalized just for you
              </p>
              <Button
                variant="hero"
                size="lg"
                onClick={handleDownload}
                className="w-full"
              >
                <Download className="w-5 h-5" />
                Download High-Res File
              </Button>
            </CardContent>
          </Card>

          {/* Email Confirmation */}
          <Card className="border-2 border-accent/20 shadow-xl bg-gradient-to-br from-accent/10 to-secondary/20">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <Mail className="w-16 h-16 text-accent mx-auto" />
                <h3 className="text-2xl font-bold">Check Your Email!</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A download link to your personalized artbook has been sent to your email address.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/40 border border-primary/10 space-y-2">
                <p className="text-sm font-semibold">What's included:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Full 24-page storybook (PDF)</li>
                  <li>✓ High-resolution download</li>
                  <li>✓ No watermarks</li>
                  <li>✓ Ready to print or read digitally</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-center text-muted-foreground mb-4">
                  Want to order a printed keepsake edition? (Coming soon!)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Input Section */}
        <Card className="border-2 border-secondary shadow-xl bg-gradient-to-br from-secondary/40 to-accent/10 mb-8">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-xl font-bold">Didn't receive the email?</h3>
            <p className="text-sm text-muted-foreground">
              Check your spam folder, or enter your email below to resend
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"
              />
              <Button variant="magic">Resend</Button>
            </div>
          </CardContent>
        </Card>

        {/* Back Home Button */}
        <div className="text-center">
          <Button
            variant="hero"
            size="xl"
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className="animate-glow-pulse"
          >
            <Sparkles className="w-5 h-5" />
            Back Home
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Thank you for choosing YourFairyTale.ai ✨<br />
          Creating magical memories, one story at a time
        </p>
      </div>
    </div>
  );
};

export default ThankYou;
