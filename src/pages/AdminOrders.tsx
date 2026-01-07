import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrderCard } from "./admin/OrderCard";
import { OrderActions } from "./admin/OrderActions";
import { OrderErrorAlert } from "./admin/OrderErrorAlert";
import { OrderFilters } from "./admin/OrderFilters";

interface PersonalizationData {
  heroName: string;
  gender: string;
  petType?: string;
  petName?: string;
  favoriteColor?: string;
  city?: string;
  favoriteFood?: string;
}

type OrderStatus =
  | "payment_received"
  | "generating_images"
  | "pages_in_progress"
  | "pages_ready_for_review"
  | "pending_admin_review"
  | "approved"
  | "email_sent"
  | "cancelled";

type StatusFilter =
  | "all"
  | "needs_attention"
  | "payment_received"
  | "pending_admin_review"
  | "approved"
  | "email_sent";

const AdminOrders = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [approvingOrders, setApprovingOrders] = useState<Set<string>>(
    new Set()
  );

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          story:stories(title)
        `)
        .order("created_at", { ascending: false });

      // Apply status filter
      if (statusFilter === "needs_attention") {
        query = query.not("error_log", "is", null);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Apply search filter on client side
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        return data.filter((order) => {
          const personalization = order.personalization_data as unknown as PersonalizationData;
          return (
            order.user_email.toLowerCase().includes(searchLower) ||
            personalization.heroName.toLowerCase().includes(searchLower)
          );
        });
      }

      return data;
    },
  });


  const handleRetry = async (orderId: string) => {
    // Just clear the error - admin will use "Start Page Generation" for new flow
    const { error: updateError } = await supabase
      .from("orders")
      .update({ error_log: null, status: "payment_received" })
      .eq("id", orderId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to reset order status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Error cleared. Use 'Start Page Generation' to begin page-by-page generation.",
    });
    refetch();
  };

  const handleForceRegenerate = async (orderId: string) => {
    // Reset order to initial state - admin will use page-by-page generation
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        pdf_url: null,
        pdf_generated_at: null,
        error_log: null,
        generated_pages: [],
        status: "payment_received",
      })
      .eq("id", orderId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to reset order",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Order reset. Click 'Start Page Generation' to begin.",
    });
    refetch();
  };

  const handleApprove = async (orderId: string) => {
    setApprovingOrders((prev) => new Set(prev).add(orderId));
    try {
      const { error } = await supabase.functions.invoke("approve-order", {
        body: { orderId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order approved and email sent",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve order",
        variant: "destructive",
      });
      console.error("Error approving order:", error);
    } finally {
      setApprovingOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Order Management</h1>

        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <OrderFilters
            statusFilter={statusFilter}
            searchQuery={searchQuery}
            onStatusChange={setStatusFilter}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="grid gap-6">
          {orders?.map((order) => (
            <div key={order.id}>
              <OrderErrorAlert
                errorLog={order.error_log}
                generationAttempts={order.generation_attempts}
              />
              <OrderCard order={order as any}>
                <OrderActions
                  orderId={order.id}
                  status={order.status as OrderStatus}
                  pdfUrl={order.pdf_url}
                  errorLog={order.error_log}
                  isGenerating={false}
                  isApproving={approvingOrders.has(order.id)}
                  onApprove={handleApprove}
                  onForceRegenerate={handleForceRegenerate}
                  onRetry={handleRetry}
                  generatedPages={(order as any).generated_pages || []}
                  totalPages={Array.isArray((order as any).story?.pages) ? (order as any).story.pages.length : 12}
                  onRefetch={refetch}
                  pdfBatchProgress={(order as any).pdf_batch_progress}
                />
              </OrderCard>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminOrders;
