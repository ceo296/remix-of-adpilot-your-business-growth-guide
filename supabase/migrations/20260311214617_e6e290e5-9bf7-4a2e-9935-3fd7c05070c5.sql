
ALTER TABLE public.custom_fonts 
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_client_profile_id uuid REFERENCES public.client_profiles(id) ON DELETE SET NULL DEFAULT NULL;

DROP POLICY IF EXISTS "Anyone can read active fonts" ON public.custom_fonts;

CREATE POLICY "Anyone can read active public fonts"
  ON public.custom_fonts FOR SELECT
  USING (
    is_active = true AND (
      is_private = false 
      OR owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload private fonts"
  ON public.custom_fonts FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_private = true AND owner_user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete own private fonts"
  ON public.custom_fonts FOR DELETE
  TO authenticated
  USING (
    (is_private = true AND owner_user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
