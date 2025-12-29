-- Create storage bucket for brand assets (logos, brand books)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own brand assets
CREATE POLICY "Users can upload their own brand assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own brand assets
CREATE POLICY "Users can update their own brand assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own brand assets
CREATE POLICY "Users can delete their own brand assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to brand assets
CREATE POLICY "Brand assets are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-assets');