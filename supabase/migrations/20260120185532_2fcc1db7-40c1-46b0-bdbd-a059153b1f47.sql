-- Add honorific preference column to client_profiles
ALTER TABLE public.client_profiles 
ADD COLUMN honorific_preference text DEFAULT 'neutral';

-- Add a check constraint for valid values
ALTER TABLE public.client_profiles 
ADD CONSTRAINT valid_honorific CHECK (honorific_preference IN ('mr', 'mrs', 'neutral'));