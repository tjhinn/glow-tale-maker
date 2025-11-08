-- Remove the dangerous public read policy on orders table
DROP POLICY IF EXISTS "Allow unauthenticated read for testing" ON public.orders;

-- Add a policy for authenticated users to view only their own orders via email
-- This allows customers to access their order history after authentication is implemented
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
