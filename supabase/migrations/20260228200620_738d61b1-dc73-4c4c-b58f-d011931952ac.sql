
-- Table to store AI-generated insights as active knowledge for agents
CREATE TABLE public.sector_brain_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL, -- 'general', 'topic_real_estate', 'visual_patterns', etc.
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.sector_brain_insights ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admins can manage insights"
ON public.sector_brain_insights
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read (agents need this)
CREATE POLICY "Authenticated can read insights"
ON public.sector_brain_insights
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_sector_brain_insights_updated_at
BEFORE UPDATE ON public.sector_brain_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
