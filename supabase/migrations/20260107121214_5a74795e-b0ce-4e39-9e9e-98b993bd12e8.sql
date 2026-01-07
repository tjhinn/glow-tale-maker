-- Add pdf_batch_progress column to track batch compilation progress
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pdf_batch_progress jsonb DEFAULT NULL;