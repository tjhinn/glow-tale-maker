import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageThumbnail } from "./PageThumbnail";
import { Loader2, BookOpen } from "lucide-react";

interface GeneratedPage {
  page: number;
  image_url: string | null;
  status: "not_generated" | "pending_review" | "approved";
  generated_at?: string;
  text?: string;
}

interface PageReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalPages: number;
  generatedPages: GeneratedPage[];
  onRefetch: () => void;
}

export function PageReview({
  open,
  onOpenChange,
  orderId,
  totalPages,
  generatedPages,
  onRefetch,
}: PageReviewProps) {
  const { toast } = useToast();
  const [generatingPages, setGeneratingPages] = useState<Set<number>>(new Set());
  const [compilingPdf, setCompilingPdf] = useState(false);

  // Create array of all pages (1 to totalPages)
  const allPages: GeneratedPage[] = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    const existingPage = generatedPages.find((p) => p.page === pageNum);
    return (
      existingPage || {
        page: pageNum,
        image_url: null,
        status: "not_generated" as const,
      }
    );
  });

  const handleGeneratePage = async (pageNumber: number) => {
    setGeneratingPages((prev) => new Set(prev).add(pageNumber));
    try {
      const { error } = await supabase.functions.invoke("generate-single-page", {
        body: { orderId, pageNumber },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Page ${pageNumber} generated`,
      });
      onRefetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate page ${pageNumber}`,
        variant: "destructive",
      });
      console.error("Error generating page:", error);
    } finally {
      setGeneratingPages((prev) => {
        const next = new Set(prev);
        next.delete(pageNumber);
        return next;
      });
    }
  };

  const handleGenerateAll = async () => {
    const notGeneratedPages = allPages
      .filter((p) => p.status === "not_generated")
      .map((p) => p.page);

    for (const pageNum of notGeneratedPages) {
      await handleGeneratePage(pageNum);
    }
  };

  const handleApprovePage = async (pageNumber: number) => {
    try {
      // Get current page data to preserve other fields
      const { data: order } = await supabase
        .from("orders")
        .select("generated_pages")
        .eq("id", orderId)
        .single();

      if (!order) throw new Error("Order not found");

      const pages = (order.generated_pages as unknown as GeneratedPage[]) || [];
      const currentPage = pages.find((p) => p.page === pageNumber);
      
      if (!currentPage) throw new Error("Page not found");

      // Use atomic update to change only the status
      const { error } = await supabase.rpc('update_generated_page', {
        p_order_id: orderId,
        p_page_number: pageNumber,
        p_image_url: currentPage.image_url,
        p_status: 'approved',
        p_generated_at: currentPage.generated_at || new Date().toISOString(),
        p_text: currentPage.text || '',
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Page ${pageNumber} approved`,
      });
      onRefetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to approve page ${pageNumber}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectPage = async (pageNumber: number) => {
    try {
      // Use atomic update to reset the page
      const { error } = await supabase.rpc('update_generated_page', {
        p_order_id: orderId,
        p_page_number: pageNumber,
        p_image_url: null,
        p_status: 'not_generated',
        p_generated_at: new Date().toISOString(),
        p_text: null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Page ${pageNumber} marked for regeneration`,
      });
      onRefetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reset page ${pageNumber}`,
        variant: "destructive",
      });
    }
  };

  const handleCompilePdf = async () => {
    setCompilingPdf(true);
    try {
      const { error } = await supabase.functions.invoke("compile-storybook-pdf", {
        body: { orderId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "PDF compiled successfully",
      });
      onOpenChange(false);
      onRefetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to compile PDF",
        variant: "destructive",
      });
      console.error("Error compiling PDF:", error);
    } finally {
      setCompilingPdf(false);
    }
  };

  const approvedCount = allPages.filter((p) => p.status === "approved").length;
  const allApproved = approvedCount === totalPages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Review Pages ({approvedCount}/{totalPages} approved)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateAll}
              disabled={generatingPages.size > 0}
              variant="outline"
            >
              {generatingPages.size > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate All Remaining"
              )}
            </Button>
            <Button
              onClick={handleCompilePdf}
              disabled={!allApproved || compilingPdf}
              className="ml-auto"
            >
              {compilingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compiling...
                </>
              ) : (
                "Compile Final PDF"
              )}
            </Button>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allPages.map((page) => (
              <PageThumbnail
                key={page.page}
                pageNumber={page.page}
                imageUrl={page.image_url}
                status={page.status}
                text={page.text}
                isGenerating={generatingPages.has(page.page)}
                onGenerate={() => handleGeneratePage(page.page)}
                onApprove={() => handleApprovePage(page.page)}
                onReject={() => handleRejectPage(page.page)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}