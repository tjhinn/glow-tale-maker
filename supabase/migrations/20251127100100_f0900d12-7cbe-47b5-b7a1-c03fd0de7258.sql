-- Add error tracking and generation attempt columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS error_log TEXT,
ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 0;