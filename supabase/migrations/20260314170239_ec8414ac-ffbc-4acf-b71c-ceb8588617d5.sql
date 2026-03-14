
CREATE TABLE public.radio_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_profile_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  script_title TEXT NOT NULL,
  script_text TEXT NOT NULL,
  script_with_nikud TEXT,
  voice_direction JSONB,
  duration TEXT,
  voice_notes TEXT,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.radio_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own radio scripts"
  ON public.radio_scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own radio scripts"
  ON public.radio_scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own radio scripts"
  ON public.radio_scripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own radio scripts"
  ON public.radio_scripts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all radio scripts"
  ON public.radio_scripts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
