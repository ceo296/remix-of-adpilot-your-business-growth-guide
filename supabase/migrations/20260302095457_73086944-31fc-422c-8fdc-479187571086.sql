
-- Table for storing HTML layout templates with placeholder support
CREATE TABLE public.ad_layout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html_template TEXT NOT NULL,
  placeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_global BOOLEAN NOT NULL DEFAULT true,
  client_profile_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  thumbnail_url TEXT,
  media_type TEXT DEFAULT 'print',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_layout_templates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage templates"
ON public.ad_layout_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read global templates and their own client templates
CREATE POLICY "Users can read available templates"
ON public.ad_layout_templates
FOR SELECT
USING (
  is_active = true AND (
    is_global = true
    OR client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid() OR agency_owner_id = auth.uid()
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_ad_layout_templates_updated_at
BEFORE UPDATE ON public.ad_layout_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add default_template_id to client_profiles
ALTER TABLE public.client_profiles
ADD COLUMN default_template_id UUID REFERENCES public.ad_layout_templates(id) ON DELETE SET NULL;
