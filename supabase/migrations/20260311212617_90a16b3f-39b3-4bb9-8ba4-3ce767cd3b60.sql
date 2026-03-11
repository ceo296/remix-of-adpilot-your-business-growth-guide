
-- Create custom_fonts table
CREATE TABLE public.custom_fonts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_he TEXT,
  family TEXT NOT NULL,
  weight TEXT NOT NULL DEFAULT '400',
  style TEXT NOT NULL DEFAULT 'normal',
  file_url TEXT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'woff2',
  source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_fonts ENABLE ROW LEVEL SECURITY;

-- Everyone can read active fonts
CREATE POLICY "Anyone can read active fonts"
  ON public.custom_fonts FOR SELECT
  USING (is_active = true);

-- Admins can manage fonts
CREATE POLICY "Admins can manage fonts"
  ON public.custom_fonts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for font files
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-fonts', 'custom-fonts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for font bucket
CREATE POLICY "Anyone can read fonts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'custom-fonts');

CREATE POLICY "Admins can upload fonts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'custom-fonts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fonts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'custom-fonts' AND public.has_role(auth.uid(), 'admin'));
