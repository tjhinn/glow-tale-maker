import { Button } from "@/components/ui/button";
import { Loader2, FileText, Send, RotateCcw, XCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { PageReview } from "./PageReview";

type OrderStatus =
  | "payment_received"
  | "generating_images"
  | "pages_in_progress"
  | "pages_ready_for_review"
  | "pending_admin_review"
  | "approved"
  | "email_sent"
  | "cancelled";

interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  completedBatches: number[];
  partialPdfPath: string;
}

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  pdfUrl: string | null;
  errorLog: string | null;
  isGenerating: boolean;
  isApproving: boolean;
  isRegeneratingPdf: boolean;
  onApprove: (orderId: string) => void;
  onRegeneratePdf: (orderId: string) => void;
  onRegeneratePages: (orderId: string) => void;
  onRetry: (orderId: string) => void;
  generatedPages?: any[];
  totalPages?: number;
  onRefetch?: () => void;
  pdfBatchProgress?: BatchProgress | null;
}

export function OrderActions({
  orderId,
  status,
  pdfUrl,
  errorLog,
  isGenerating,
  isApproving,
  isRegeneratingPdf,
  onApprove,
  onRegeneratePdf,
  onRegeneratePages,
  onRetry,
  generatedPages = [],
  totalPages = 12,
  onRefetch,
  pdfBatchProgress,
}: OrderActionsProps) {
  const [showPageReview, setShowPageReview] = useState(false);
  const renderActions = () => {
    // Allow status-based actions to show even with errors
    // (retry button is rendered separately below)
    
    switch (status) {
      case "payment_received":
        return (
          <div className="space-y-2">
            <Button
              onClick={() => setShowPageReview(true)}
              className="w-full"
              variant="default"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Start Page Generation
            </Button>
            {onRefetch && (
              <PageReview
                open={showPageReview}
                onOpenChange={setShowPageReview}
                orderId={orderId}
                totalPages={totalPages}
                generatedPages={generatedPages}
                onRefetch={onRefetch}
                pdfBatchProgress={pdfBatchProgress}
              />
            )}
          </div>
        );
      
      case "pages_in_progress":
      case "pages_ready_for_review":
        const approvedCount = generatedPages.filter((p: any) => p.status === "approved").length;
        const allApproved = approvedCount === totalPages;
        
        return (
          <div className="space-y-2">
            <Button
              onClick={() => setShowPageReview(true)}
              className="w-full"
              variant="default"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Review Pages ({approvedCount}/{totalPages} approved)
            </Button>
            {allApproved && (
              <p className="text-sm text-center text-green-600 dark:text-green-400">
                ✅ All pages approved - ready to compile PDF
              </p>
            )}
            {onRefetch && (
              <PageReview
                open={showPageReview}
                onOpenChange={setShowPageReview}
                orderId={orderId}
                totalPages={totalPages}
                generatedPages={generatedPages}
                onRefetch={onRefetch}
                pdfBatchProgress={pdfBatchProgress}
              />
            )}
          </div>
        );

      case "generating_images":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is generating your storybook...</span>
            </div>
            <Button
              onClick={() => onRegeneratePages(orderId)}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel & Reset Generation
                </>
              )}
            </Button>
          </div>
        );

      case "pending_admin_review":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              {pdfUrl && (
                <Button
                  onClick={() => onApprove(orderId)}
                  disabled={isApproving}
                  className="flex-1"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Approve & Send
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onRegeneratePdf(orderId)}
                disabled={isRegeneratingPdf}
                variant="outline"
                className="flex-1"
              >
                {isRegeneratingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recompiling...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Regenerate PDF
                  </>
                )}
              </Button>
              <Button
                onClick={() => onRegeneratePages(orderId)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate Pages
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "approved":
      case "email_sent":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              {pdfUrl && (
                <Button asChild variant="outline" className="flex-1">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onRegeneratePdf(orderId)}
                disabled={isRegeneratingPdf}
                variant="outline"
                className="flex-1"
              >
                {isRegeneratingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recompiling...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Regenerate PDF
                  </>
                )}
              </Button>
              <Button
                onClick={() => onRegeneratePages(orderId)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate Pages
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "cancelled":
        return (
          <div className="text-sm text-center text-muted-foreground py-2">
            <XCircle className="inline mr-2 h-4 w-4" />
            Order cancelled
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pt-4 border-t">
      {errorLog && (
        <Button
          onClick={() => onRetry(orderId)}
          disabled={isGenerating}
          variant="outline"
          className="w-full mb-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Error & Reset
            </>
          )}
        </Button>
      )}
      {renderActions()}
    </div>
  );
}
