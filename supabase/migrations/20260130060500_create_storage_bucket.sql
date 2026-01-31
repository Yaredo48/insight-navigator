-- Create storage bucket for educational content if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('educational-content', 'educational-content', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload educational content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'educational-content' AND
  auth.role() = 'authenticated'
);

-- Policy to allow everyone to view content
CREATE POLICY "Public can view educational content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'educational-content'
);

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'educational-content' AND
  owner = auth.uid()
);

-- Policy to allow admins to delete content (assuming admin role check from profile)
-- For now, allow owners to delete
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'educational-content' AND
  owner = auth.uid()
);
