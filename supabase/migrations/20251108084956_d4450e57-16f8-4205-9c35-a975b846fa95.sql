-- Temporary policy to allow unauthenticated read for testing
-- IMPORTANT: Remove this policy before going to production
CREATE POLICY "Allow unauthenticated read for testing"
ON public.orders
FOR SELECT
TO anon
USING (true);