-- Create sector brain links table for managing general/media links
CREATE TABLE IF NOT EXISTS public.sector_brain_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  media_type TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

-- Basic validation (length + protocol)
ALTER TABLE public.sector_brain_links
  ADD CONSTRAINT sector_brain_links_url_length CHECK (char_length(url) BETWEEN 8 AND 2048);

ALTER TABLE public.sector_brain_links
  ADD CONSTRAINT sector_brain_links_url_protocol CHECK (url ~* '^https?://');

-- Optional media_type validation
ALTER TABLE public.sector_brain_links
  ADD CONSTRAINT sector_brain_links_media_type CHECK (
    media_type IS NULL OR media_type IN ('ads','text','video','signage','promo','radio')
  );

-- Enable Row Level Security
ALTER TABLE public.sector_brain_links ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can view sector brain links"
ON public.sector_brain_links
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create sector brain links"
ON public.sector_brain_links
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sector brain links"
ON public.sector_brain_links
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sector brain links"
ON public.sector_brain_links
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
DROP TRIGGER IF EXISTS update_sector_brain_links_updated_at ON public.sector_brain_links;
CREATE TRIGGER update_sector_brain_links_updated_at
BEFORE UPDATE ON public.sector_brain_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sector_brain_links_media_type ON public.sector_brain_links (media_type);
CREATE INDEX IF NOT EXISTS idx_sector_brain_links_created_at ON public.sector_brain_links (created_at DESC);
