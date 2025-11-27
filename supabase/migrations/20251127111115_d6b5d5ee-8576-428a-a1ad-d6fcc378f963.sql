-- Add generated_pages column to orders table to store individual page generation data
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS generated_pages JSONB DEFAULT '[]'::jsonb;

-- Add new order statuses for page-by-page generation
-- Update the order_status enum to include new statuses
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pages_in_progress';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pages_ready_for_review';

-- Add comment for documentation
COMMENT ON COLUMN orders.generated_pages IS 'Array of page objects with structure: [{"page": 1, "image_url": "https://...", "status": "approved|pending_review|not_generated", "generated_at": "timestamp"}]';