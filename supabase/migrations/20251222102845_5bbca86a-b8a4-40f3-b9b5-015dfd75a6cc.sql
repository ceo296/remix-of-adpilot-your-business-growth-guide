-- Create branding_orders table for the Branding Studio module
CREATE TABLE public.branding_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Brief responses
  essence TEXT, -- Elevator pitch
  differentiator TEXT, -- What makes them different
  persona TEXT, -- Brand personality
  audience TEXT, -- Target audience
  vision TEXT, -- 2-year vision
  design_preferences TEXT, -- Color/style preferences
  
  -- Package selection
  package_type TEXT, -- 'visibility' or 'full_brand'
  package_price NUMERIC,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, in_progress, completed
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branding_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create own branding orders" 
ON public.branding_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own branding orders" 
ON public.branding_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own branding orders" 
ON public.branding_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all branding orders" 
ON public.branding_orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all branding orders" 
ON public.branding_orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_branding_orders_updated_at
BEFORE UPDATE ON public.branding_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();