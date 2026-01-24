-- Create new bucket for customer order-generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-images', 'order-images', true);

-- RLS policies for the new bucket
CREATE POLICY "Anyone can view order images"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');

CREATE POLICY "Service role can upload order images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images');

CREATE POLICY "Service role can delete order images"
ON storage.objects FOR DELETE
USING (bucket_id = 'order-images');