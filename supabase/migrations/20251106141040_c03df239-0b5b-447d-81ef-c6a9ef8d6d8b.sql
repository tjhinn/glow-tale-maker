-- Make hero-photos bucket public so photos display correctly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'hero-photos';