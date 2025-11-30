import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Trash2, Edit, Eye, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: string;
  reviewer_name: string;
  review_text: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchReviews();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin/login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      toast({
        title: "Access denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate('/admin/login');
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!reviewerName.trim() || !reviewText.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('reviews')
          .update({
            reviewer_name: reviewerName,
            review_text: reviewText,
            rating: rating,
            display_order: displayOrder,
            is_active: isActive,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Review updated successfully",
        });
      } else {
        // Insert new
        const { error } = await supabase
          .from('reviews')
          .insert({
            reviewer_name: reviewerName,
            review_text: reviewText,
            rating: rating,
            display_order: displayOrder,
            is_active: isActive,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Review added successfully",
        });
      }

      // Reset form
      resetForm();
      setDialogOpen(false);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setReviewerName("");
    setReviewText("");
    setRating(5);
    setDisplayOrder(0);
    setIsActive(true);
    setEditingId(null);
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setReviewerName(review.reviewer_name);
    setReviewText(review.review_text);
    setRating(review.rating);
    setDisplayOrder(review.display_order);
    setIsActive(review.is_active);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Review ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            <h1 className="text-3xl font-wonderia font-bold">Manage Reviews</h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setDisplayOrder(reviews.length);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit' : 'Add'} Review</DialogTitle>
                  <DialogDescription>
                    Add or edit customer reviews displayed on the homepage
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="reviewer-name">Reviewer Name *</Label>
                    <Input
                      id="reviewer-name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g., Sarah M."
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-text">Review Text *</Label>
                    <Textarea
                      id="review-text"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Enter the review text..."
                      rows={4}
                      maxLength={500}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {reviewText.length}/500 characters
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Select
                      value={rating.toString()}
                      onValueChange={(value) => setRating(parseInt(value))}
                    >
                      <SelectTrigger id="rating">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: num }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                              ))}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="active">Active (visible on homepage)</Label>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingId ? 'Update' : 'Add'} Review</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No reviews yet. Add your first review to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-semibold">{review.reviewer_name}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate">{review.review_text}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{review.display_order}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            review.is_active
                              ? 'bg-success/20 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {review.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(review)}
                            title="Edit review"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(review.id, review.is_active)}
                            title={review.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            title="Delete review"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default AdminReviews;
