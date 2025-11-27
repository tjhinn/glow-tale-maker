import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg">
                {personalization.heroName}'s Story
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              {order.user_email}
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Story and Payment Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Story</p>
            <p className="font-medium">{order.story?.title || "Unknown"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount Paid</p>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <p className="font-medium">
                {order.amount_paid
                  ? `${(order.amount_paid / 100).toFixed(2)} ${(order.currency || "USD").toUpperCase()}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Personalization Details */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Personalization Details
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {personalization.petName && personalization.petType && (
              <div>
                <span className="text-muted-foreground">Pet:</span>{" "}
                <span className="font-medium">
                  {personalization.petName} ({personalization.petType})
                </span>
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
                <span className="font-medium">
                  {personalization.favoriteColor}
                </span>
              </div>
            )}
            {personalization.favoriteFood && (
              <div>
                <span className="text-muted-foreground">Food:</span>{" "}
                <span className="font-medium">
                  {personalization.favoriteFood}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Page Generation Status */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Page Generation Progress
          </p>
          {(() => {
            const generatedPages = (order as any).generated_pages || [];
            const storyPages = (order as any).story?.pages || [];
            const totalPages = Array.isArray(storyPages) ? storyPages.length : 12;
            const generatedCount = generatedPages.length;
            const approvedCount = generatedPages.filter((p: any) => p.status === "approved").length;

            return (
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{generatedCount}</span> / {totalPages} pages generated
                </p>
                <p className="text-sm">
                  <span className="font-medium">{approvedCount}</span> / {totalPages} pages approved
                </p>
              </div>
            );
          })()}
        </div>

        {/* PDF Status */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            PDF Status
          </p>
          {order.pdf_url && order.pdf_generated_at ? (
            <div className="space-y-1">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✅ Generated: {formatDate(order.pdf_generated_at)}
              </p>
              <a
                href={order.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                🔗 Preview PDF
              </a>
            </div>
          ) : order.error_log ? (
            <p className="text-sm text-destructive">
              ❌ Generation Failed (Attempt {order.generation_attempts || 0}/3)
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Pending PDF compilation</p>
          )}
        </div>

        {/* Order Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>Order created: {formatDate(order.created_at)}</span>
        </div>

        {/* Action Buttons Area */}
        {children}
      </CardContent>
    </Card>
  );
}
