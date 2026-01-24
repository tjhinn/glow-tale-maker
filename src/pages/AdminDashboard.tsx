import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, Trash2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/admin/login');
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roles) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have admin privileges.",
        });
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setUserEmail(session.user.email || "");
    } catch (error) {
      console.error('Admin check error:', error);
      navigate('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/admin/login');
  };

  const handleCleanupStorage = async (dryRun: boolean) => {
    setIsCleaningUp(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-orphaned-storage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ dryRun }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Cleanup failed");
      }

      const totalDeleted =
        result.storyImages.deletedCount +
        result.orderImages.deletedCount +
        result.heroPhotos.deletedCount +
        result.generatedPdfs.deletedCount;

      toast({
        title: dryRun ? "Dry Run Complete" : "Cleanup Complete",
        description: dryRun
          ? `Would delete ${totalDeleted} files. Preserved ${result.storyImages.preservedCount} story template folders.`
          : `Deleted ${totalDeleted} files. Preserved ${result.storyImages.preservedCount} story template folders.`,
      });
    } catch (error) {
      console.error("Cleanup error:", error);
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCleaningUp(false);
    }
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
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-xl font-semibold mb-2">Manage Orders</h2>
              <p className="text-muted-foreground mb-4">
                View and process customer orders
              </p>
              <Button onClick={() => navigate('/admin/orders')}>
                View Orders
              </Button>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-xl font-semibold mb-2">Manage Stories</h2>
              <p className="text-muted-foreground mb-4">
                Create and edit story templates
              </p>
              <Button onClick={() => navigate('/admin/stories')}>
                Manage Stories
              </Button>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-xl font-semibold mb-2">Manage Carousel</h2>
              <p className="text-muted-foreground mb-4">
                Add and remove images from the homepage carousel
              </p>
              <Button onClick={() => navigate('/admin/carousel')}>
                Manage Carousel
              </Button>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <h2 className="text-xl font-semibold mb-2">Manage Reviews</h2>
              <p className="text-muted-foreground mb-4">
                Add and edit customer reviews displayed on the homepage
              </p>
              <Button onClick={() => navigate('/admin/reviews')}>
                Manage Reviews
              </Button>
            </div>

            <div className="p-6 rounded-lg border bg-card border-destructive/50">
              <h2 className="text-xl font-semibold mb-2">Clean Up Storage</h2>
              <p className="text-muted-foreground mb-4">
                Delete orphaned order images, hero photos, and PDFs (preserves story templates)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCleanupStorage(true)}
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Preview
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isCleaningUp}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Up
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all orphaned order images, hero photos, and generated PDFs.
                        Story template images will be preserved. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleCleanupStorage(false)}>
                        Delete Files
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
