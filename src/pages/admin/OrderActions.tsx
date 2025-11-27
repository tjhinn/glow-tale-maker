import { Button } from "@/components/ui/button";
import { Loader2, FileText, Send, RotateCcw, XCircle } from "lucide-react";

type OrderStatus =
  | "payment_received"
  | "generating_images"
  | "pending_admin_review"
  | "approved"
  | "email_sent"
  | "cancelled";

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  pdfUrl: string | null;
  errorLog: string | null;
  isGenerating: boolean;
  isApproving: boolean;
  onGeneratePDF: (orderId: string) => void;
  onApprove: (orderId: string) => void;
  onForceRegenerate: (orderId: string) => void;
  onRetry: (orderId: string) => void;
}

export function OrderActions({
  orderId,
  status,
  pdfUrl,
  errorLog,
  isGenerating,
  isApproving,
  onGeneratePDF,
  onApprove,
  onForceRegenerate,
  onRetry,
}: OrderActionsProps) {
  const renderActions = () => {
    // If there's an error, only show retry button (don't show status-based actions)
    if (errorLog) {
      return null; // Retry button is rendered separately below
    }

    switch (status) {
      case "payment_received":
        return (
          <Button
            onClick={() => onGeneratePDF(orderId)}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        );

      case "generating_images":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is generating your storybook...</span>
            </div>
            <Button
              onClick={() => onForceRegenerate(orderId)}
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
            <Button
              onClick={() => onForceRegenerate(orderId)}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Force Regenerate
                </>
              )}
            </Button>
          </div>
        );

      case "approved":
      case "email_sent":
        return (
          <div className="flex gap-2">
            {pdfUrl && (
              <Button asChild variant="outline" className="flex-1">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}
            <Button
              onClick={() => onForceRegenerate(orderId)}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
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
          variant="destructive"
          className="w-full mb-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry Generation
            </>
          )}
        </Button>
      )}
      {renderActions()}
    </div>
  );
}
