-- Fix: Remove the overly permissive UPDATE policy
-- The service role already bypasses RLS, so no policy is needed for it
-- By removing this policy, only service role can update (via RLS bypass)
DROP POLICY IF EXISTS "Service role can update jobs" ON public.cover_generation_jobs;