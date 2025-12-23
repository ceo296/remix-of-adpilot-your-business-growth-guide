-- Create table for campaign media proofs (clippings and screenshots)
CREATE TABLE public.campaign_media_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  media_outlet_name TEXT NOT NULL,
  proof_type TEXT NOT NULL DEFAULT 'clipping', -- 'clipping' or 'screenshot'
  image_url TEXT NOT NULL,
  publication_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.campaign_media_proofs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view proofs for their campaigns" 
ON public.campaign_media_proofs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_media_proofs.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create proofs for their campaigns" 
ON public.campaign_media_proofs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_media_proofs.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete proofs for their campaigns" 
ON public.campaign_media_proofs 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_media_proofs.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

-- Admin can manage all proofs
CREATE POLICY "Admins can manage all proofs" 
ON public.campaign_media_proofs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for campaign proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-proofs', 'campaign-proofs', true);

-- Storage policies for campaign proofs
CREATE POLICY "Users can upload proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'campaign-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'campaign-proofs');

CREATE POLICY "Users can delete their proofs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'campaign-proofs' AND auth.role() = 'authenticated');