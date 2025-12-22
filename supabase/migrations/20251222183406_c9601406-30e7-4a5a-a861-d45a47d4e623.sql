-- Add audience targeting fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS budget numeric,
ADD COLUMN IF NOT EXISTS target_stream text, -- litvish, hasidic, sephardi, general
ADD COLUMN IF NOT EXISTS target_gender text, -- men, women, family
ADD COLUMN IF NOT EXISTS target_city text;

-- Add sector/stream field to media_outlets for matching
ALTER TABLE public.media_outlets
ADD COLUMN IF NOT EXISTS stream text; -- litvish, hasidic, sephardi, general

-- Add gender targeting to media_products
ALTER TABLE public.media_products
ADD COLUMN IF NOT EXISTS gender_target text; -- men, women, family, all