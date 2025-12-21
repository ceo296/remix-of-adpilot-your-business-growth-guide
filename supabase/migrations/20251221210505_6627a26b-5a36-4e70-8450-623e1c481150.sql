-- Add logo_url and brand color to outlets
ALTER TABLE public.media_outlets 
ADD COLUMN logo_url TEXT,
ADD COLUMN brand_color TEXT DEFAULT '#E31E24';