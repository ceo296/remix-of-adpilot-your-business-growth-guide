-- Create table for sector brain examples (Hall of Fame, Red Lines, Brand Assets)
CREATE TABLE public.sector_brain_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone TEXT NOT NULL CHECK (zone IN ('fame', 'redlines', 'assets')),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for generated images
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visual_prompt TEXT NOT NULL,
  text_prompt TEXT,
  style TEXT NOT NULL,
  engine TEXT NOT NULL,
  image_url TEXT NOT NULL,
  kosher_status TEXT NOT NULL DEFAULT 'pending' CHECK (kosher_status IN ('approved', 'needs-review', 'rejected', 'pending')),
  kosher_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sector_brain_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth required for MVP)
CREATE POLICY "Allow public read on sector_brain_examples" 
ON public.sector_brain_examples 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on sector_brain_examples" 
ON public.sector_brain_examples 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete on sector_brain_examples" 
ON public.sector_brain_examples 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read on generated_images" 
ON public.generated_images 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on generated_images" 
ON public.generated_images 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on generated_images" 
ON public.generated_images 
FOR UPDATE 
USING (true);

-- Create storage bucket for sector brain uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sector-brain', 'sector-brain', true);

-- Storage policies
CREATE POLICY "Public read access for sector-brain" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'sector-brain');

CREATE POLICY "Public upload to sector-brain" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'sector-brain');

CREATE POLICY "Public delete from sector-brain" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'sector-brain');