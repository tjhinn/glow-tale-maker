import { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const PageWrapper = ({ 
  children, 
  className = "", 
  showHeader = true,
  showFooter = true,
}: PageWrapperProps) => {
  return (
    <div className="min-h-screen gradient-warm flex flex-col">
      {showHeader && (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ArtBookMagic
            </h1>
          </div>
        </header>
      )}
      <main className={`flex-1 ${className}`}>{children}</main>
      {showFooter && <SiteFooter />}
    </div>
  );
};
