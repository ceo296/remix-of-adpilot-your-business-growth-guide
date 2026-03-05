ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS opening_hours text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS branches text DEFAULT NULL;