import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
}

export const PageWrapper = ({ 
  children, 
  className = "", 
  showHeader = true 
}: PageWrapperProps) => {
  return (
    <div className="min-h-screen gradient-warm">
      {showHeader && (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl md:text-3xl font-bold font-playfair text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              YourFairyTale.ai
            </h1>
          </div>
        </header>
      )}
      <main className={className}>{children}</main>
    </div>
  );
};
