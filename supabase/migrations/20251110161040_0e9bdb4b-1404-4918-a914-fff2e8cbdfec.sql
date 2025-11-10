-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create a security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

-- Recreate the policy using the safe function
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (user_email = public.get_current_user_email());