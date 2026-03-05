ALTER TABLE public.client_profiles 
  ADD COLUMN IF NOT EXISTS brand_presence text,
  ADD COLUMN IF NOT EXISTS quality_signatures jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audience_tone text;