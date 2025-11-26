import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminTest() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, stories(title)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (orderId: string) => {
    setGeneratingIds(prev => new Set(prev).add(orderId));
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-storybook", {
        body: { orderId },
      });

      if (error) throw error;

      toast({
        title: "PDF Generated Successfully! ✨",
        description: `PDF URL: ${data.pdfUrl}`,
      });

      // Refresh orders to show updated status
      await fetchOrders();
    } catch (error: any) {
      toast({
        title: "PDF Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setApprovingIds(prev => new Set(prev).add(orderId));
    
    try {
      const { data, error } = await supabase.functions.invoke("approve-order", {
        body: { orderId },
      });

      if (error) throw error;

      toast({
        title: "Order Approved & Email Sent! ✨",
        description: "The customer has been notified via email.",
      });

      // Refresh orders to show updated status
      await fetchOrders();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-fredoka font-bold">Admin Test - Orders</h1>
            <Button onClick={fetchOrders} variant="outline">
              Refresh
            </Button>
          </div>

          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Story</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PDF URL</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{order.user_email}</TableCell>
                      <TableCell>{order.stories?.title || "N/A"}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-secondary">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.pdf_url ? (
                          <a 
                            href={order.pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not generated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleGeneratePDF(order.id)}
                            disabled={generatingIds.has(order.id)}
                            size="sm"
                            variant="outline"
                          >
                            {generatingIds.has(order.id) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate PDF"
                            )}
                          </Button>
                          
                          {order.status === "pending_admin_review" && order.pdf_url && (
                            <Button
                              onClick={() => handleApproveOrder(order.id)}
                              disabled={approvingIds.has(order.id)}
                              size="sm"
                            >
                              {approvingIds.has(order.id) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                "Approve & Send"
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
