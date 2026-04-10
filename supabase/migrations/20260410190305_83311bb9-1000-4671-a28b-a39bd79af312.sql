-- Allow anyone to upload files to travel-images bucket
CREATE POLICY "Allow uploads to travel-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'travel-images');

-- Allow updates (upserts) to travel-images bucket
CREATE POLICY "Allow updates to travel-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'travel-images');
