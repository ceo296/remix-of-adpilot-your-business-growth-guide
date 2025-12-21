-- Create storage bucket for media logos
INSERT INTO storage.buckets (id, name, public) VALUES ('media-logos', 'media-logos', true);

-- Create policies for media logos bucket
CREATE POLICY "Media logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media-logos');

CREATE POLICY "Admins can upload media logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'media-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update media logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'media-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete media logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'media-logos' AND has_role(auth.uid(), 'admin'::app_role));