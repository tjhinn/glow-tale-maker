import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, DollarSign, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getFreshaSignedPdfUrl } from "@/lib/pdfSignedUrl";
import { useToast } from "@/hooks/use-toast";

interface PersonalizationData {
  heroName: string;
  gender: string;
  petType?: string;
  petName?: string;
  favoriteColor?: string;
  city?: string;
  favoriteFood?: string;
}

interface Order {
  id: string;
  user_email: string;
  personalization_data: PersonalizationData;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  error_log: string | null;
  generation_attempts: number | null;
  story?: {
    title: string;
  };
}

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    payment_received: "bg-blue-500",
    generating_images: "bg-yellow-500",
    pending_admin_review: "bg-orange-500",
    approved: "bg-green-500",
    email_sent: "bg-emerald-500",
    cancelled: "bg-gray-500",
  };
  return colors[status] || "bg-gray-500";
};

const getStatusLabel = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function OrderCard({ order, children }: OrderCardProps) {
  const personalization = order.personalization_data as PersonalizationData;
  const { toast } = useToast();
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handlePreviewPdf = async () => {
    if (!order.pdf_url) return;
    setLoadingPreview(true);
    try {
      const url = await getFreshaSignedPdfUrl(order.pdf_url);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({ title: "Error", description: "Failed to generate preview URL", variant: "destructive" });
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <h3 className="font-semibold text-sm truncate">
                {personalization.heroName}'s Story
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{order.user_email}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-[10px] shrink-0`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-2">
        {/* Story and Payment Info */}
        <div className="space-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Story: </span>
            <span className="font-medium">{order.story?.title || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
              {order.amount_paid
                ? `${(order.amount_paid / 100).toFixed(2)} ${(order.currency || "USD").toUpperCase()}`
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Personalization Details */}
        <div className="bg-muted/50 rounded-md p-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">
            Personalization
          </p>
          <div className="space-y-0.5 text-xs">
            {personalization.petName && personalization.petType && (
              <div>
                <span className="text-muted-foreground">Pet:</span>{" "}
                <span className="font-medium">{personalization.petName} ({personalization.petType})</span>
              </div>
            )}
            {personalization.city && (
              <div>
                <span className="text-muted-foreground">City:</span>{" "}
                <span className="font-medium">{personalization.city}</span>
              </div>
            )}
            {personalization.favoriteColor && (
              <div>
                <span className="text-muted-foreground">Color:</span>{" "}
                <span className="font-medium">{personalization.favoriteColor}</span>
              </div>
            )}
            {personalization.favoriteFood && (
              <div>
                <span className="text-muted-foreground">Food:</span>{" "}
                <span className="font-medium">{personalization.favoriteFood}</span>
              </div>
            )}
          </div>
        </div>

        {/* Page Generation Status */}
        <div className="bg-muted/50 rounded-md p-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">
            Pages
          </p>
          {(() => {
            const generatedPages = (order as any).generated_pages || [];
            const storyPages = (order as any).story?.pages || [];
            const totalPages = Array.isArray(storyPages) ? storyPages.length : 12;
            const generatedCount = generatedPages.length;
            const approvedCount = generatedPages.filter((p: any) => p.status === "approved").length;
            return (
              <div className="text-xs space-y-0.5">
                <p><span className="font-medium">{generatedCount}</span> / {totalPages} generated</p>
                <p><span className="font-medium">{approvedCount}</span> / {totalPages} approved</p>
              </div>
            );
          })()}
        </div>

        {/* PDF Status */}
        <div className="bg-muted/50 rounded-md p-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">
            PDF
          </p>
          {order.pdf_url && order.pdf_generated_at ? (
            <div className="space-y-0.5">
              <p className="text-xs text-green-600 dark:text-green-400">
                ✅ {formatDate(order.pdf_generated_at)}
              </p>
              <button
                onClick={handlePreviewPdf}
                disabled={loadingPreview}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                {loadingPreview ? <Loader2 className="h-3 w-3 animate-spin" /> : "🔗"} Preview
              </button>
            </div>
          ) : order.error_log ? (
            <p className="text-xs text-destructive">
              ❌ Failed (Attempt {order.generation_attempts || 0}/3)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Pending</p>
          )}
        </div>

        {/* Order Date */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(order.created_at)}</span>
        </div>

        {/* Action Buttons Area */}
        {children}
      </CardContent>
    </Card>
  );
}
