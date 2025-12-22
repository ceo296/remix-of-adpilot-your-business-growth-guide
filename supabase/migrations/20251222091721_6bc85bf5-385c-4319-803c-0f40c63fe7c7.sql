-- Add new columns for free-text target audience fields
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS end_consumer text;
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS decision_maker text;

-- Optionally drop the old column (keeping it for now as it may have data)
-- ALTER TABLE public.client_profiles DROP COLUMN target_audience;