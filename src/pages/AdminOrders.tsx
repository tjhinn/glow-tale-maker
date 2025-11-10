import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Download, CheckCircle, AlertCircle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface PersonalizationData {
  childName: string;
  gender: string;
  petName: string;
  petSpecies: string;
  city: string;
  favoriteColor: string;
  favoriteFood: string;
  photoUrl: string;
}


const AdminOrders = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, stories(title, hero_gender)')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as OrderStatus);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const handleGeneratePDF = async (orderId: string) => {
    toast.info('Starting PDF generation...');
    
    const { error } = await supabase.functions.invoke('generate-storybook', {
      body: { orderId },
    });

    if (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
      return;
    }

    toast.success('PDF generation started! It will be ready for review soon.');
    refetch();
  };

  const handleApprove = async (orderId: string) => {
    toast.info('Approving order...');
    
    const { error } = await supabase.functions.invoke('approve-order', {
      body: { orderId },
    });

    if (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve order');
      return;
    }

    toast.success('Order approved! Customer email has been sent.');
    refetch();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      payment_received: 'bg-blue-500',
      generating_images: 'bg-yellow-500',
      pending_admin_review: 'bg-orange-500',
      approved: 'bg-green-500',
      email_sent: 'bg-emerald-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-playfair">Order Management</h1>
                <p className="text-muted-foreground mt-1">
                  {orders?.length || 0} total orders
                </p>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="generating_images">Generating Images</SelectItem>
                  <SelectItem value="pending_admin_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="email_sent">Email Sent</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders && orders.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </Card>
            ) : (
              orders?.map((order) => (
                <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            {(order.personalization_data as unknown as PersonalizationData)?.childName || 'Unknown'}
                          </h3>
                          <p className="text-sm text-muted-foreground">{order.user_email}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Story</p>
                          <p className="font-medium">{order.stories?.title || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hero Name</p>
                          <p className="font-medium">
                            {(order.personalization_data as unknown as PersonalizationData)?.childName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount Paid</p>
                          <p className="font-medium">
                            ${(order.amount_paid || 0) / 100}
                            {order.discount_applied && (
                              <span className="text-green-600 ml-2">(10% off)</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Order Date</p>
                          <p className="font-medium">{formatDate(order.created_at)}</p>
                        </div>
                      </div>

                      {order.personalization_data && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-primary hover:underline">
                            View Personalization Details
                          </summary>
                          <div className="mt-2 p-3 bg-muted rounded-lg space-y-1">
                            <p><strong>Pet:</strong> {(order.personalization_data as unknown as PersonalizationData).petName} ({(order.personalization_data as unknown as PersonalizationData).petSpecies})</p>
                            <p><strong>City:</strong> {(order.personalization_data as unknown as PersonalizationData).city}</p>
                            <p><strong>Favorite Color:</strong> {(order.personalization_data as unknown as PersonalizationData).favoriteColor}</p>
                            <p><strong>Favorite Food:</strong> {(order.personalization_data as unknown as PersonalizationData).favoriteFood}</p>
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-2 lg:min-w-[200px]">
                      {order.status === 'payment_received' && (
                        <Button 
                          onClick={() => handleGeneratePDF(order.id)}
                          className="w-full"
                        >
                          Generate PDF
                        </Button>
                      )}
                      
                      {order.status === 'generating_images' && (
                        <div className="text-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Generating...</p>
                        </div>
                      )}
                      
                      {order.status === 'pending_admin_review' && (
                        <>
                          {order.pdf_url && (
                            <Button 
                              variant="outline" 
                              asChild
                              className="w-full"
                            >
                              <a href={order.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Preview PDF
                              </a>
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleApprove(order.id)}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Send
                          </Button>
                        </>
                      )}
                      
                      {(order.status === 'approved' || order.status === 'email_sent') && order.pdf_url && (
                        <Button 
                          variant="outline" 
                          asChild
                          className="w-full"
                        >
                          <a href={order.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminOrders;
