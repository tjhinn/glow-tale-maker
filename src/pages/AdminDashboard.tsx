import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
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
            <h1 className="text-2xl font-playfair font-bold">Admin Dashboard</h1>
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
              <h2 className="text-xl font-semibold mb-2">Test Features</h2>
              <p className="text-muted-foreground mb-4">
                Test order generation and PDF creation
              </p>
              <Button onClick={() => navigate('/admin/test')}>
                Go to Test Page
              </Button>
            </div>
          </div>
        </main>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
