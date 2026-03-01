-- Remove the unique constraint on user_id to allow multiple client profiles per user
-- This is needed for agency flow where one user manages multiple clients
ALTER TABLE public.client_profiles DROP CONSTRAINT IF EXISTS client_profiles_user_id_key;