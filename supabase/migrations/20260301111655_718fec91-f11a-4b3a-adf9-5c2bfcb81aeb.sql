-- Add business_photos column to store URLs of uploaded business/product photos
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS business_photos jsonb DEFAULT '[]'::jsonb;