import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PageThumbnailProps {
  pageNumber: number;
  imageUrl: string | null;
  status: "not_generated" | "pending_review" | "approved";
  isGenerating: boolean;
  text?: string;
  onGenerate: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const getStatusBadge = (status: PageThumbnailProps["status"]) => {
  switch (status) {
    case "not_generated":
      return <Badge variant="secondary">Not Generated</Badge>;
    case "pending_review":
      return <Badge className="bg-amber-500">Pending Review</Badge>;
    case "approved":
      return <Badge className="bg-green-500">Approved</Badge>;
  }
};

export function PageThumbnail({
  pageNumber,
  imageUrl,
  status,
  isGenerating,
  text,
  onGenerate,
  onApprove,
  onReject,
}: PageThumbnailProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Page {pageNumber}</span>
          {getStatusBadge(status)}
        </div>

        {/* Image Preview */}
        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Page ${pageNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Text Preview */}
        {text && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground max-h-24 overflow-y-auto">
            <p className="font-medium text-foreground mb-1">Page Text:</p>
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {status === "not_generated" && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="w-full"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          )}

          {status === "pending_review" && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onApprove}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={onReject}
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          )}

          {status === "approved" && (
            <Button
              onClick={onReject}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Regenerate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}