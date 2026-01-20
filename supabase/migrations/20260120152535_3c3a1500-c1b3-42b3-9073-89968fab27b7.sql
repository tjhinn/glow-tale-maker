-- Create cover_generation_jobs table for async processing
CREATE TABLE public.cover_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  personalized_cover_url text,
  error_message text,
  input_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cover_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for creating jobs)
CREATE POLICY "Anyone can create jobs" ON public.cover_generation_jobs
  FOR INSERT WITH CHECK (true);

-- Allow anyone to view jobs (will use job ID as secret)
CREATE POLICY "Anyone can view jobs" ON public.cover_generation_jobs
  FOR SELECT USING (true);

-- Service role can update (edge functions)
CREATE POLICY "Service role can update jobs" ON public.cover_generation_jobs
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_cover_generation_jobs_updated_at
  BEFORE UPDATE ON public.cover_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();