import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const SiteFooter = () => {
  return (
    <footer className="py-12 border-t border-border/50 bg-secondary/10 mt-auto">
      <div className="container mx-auto px-4 text-center space-y-4">
        <div className="flex justify-center items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <p className="text-lg font-semibold font-heading">YourFairyTale.ai</p>
        </div>
        <p className="text-muted-foreground">
          Creating magical memories, one story at a time
        </p>
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm">
          <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="text-muted-foreground/40" aria-hidden="true">·</span>
          <Link to="/refund" className="text-muted-foreground hover:text-primary transition-colors">
            Refund Policy
          </Link>
          <span className="text-muted-foreground/40" aria-hidden="true">·</span>
          <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} YourFairyTale.ai • All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default SiteFooter;