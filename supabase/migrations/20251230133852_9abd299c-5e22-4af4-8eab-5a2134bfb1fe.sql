-- Add personal red lines and successful campaigns to client profiles
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS personal_red_lines text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS successful_campaigns text[] DEFAULT '{}'::text[];