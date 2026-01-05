-- Create media_portal_access table for unique links per media outlet
CREATE TABLE public.media_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.media_outlets(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create media_orders table for tracking orders to media outlets
CREATE TABLE public.media_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.media_outlets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.media_products(id),
  spec_id UUID REFERENCES public.product_specs(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'published', 'proof_uploaded', 'proof_approved', 'proof_rejected', 'completed')),
  order_notes TEXT,
  media_notes TEXT,
  client_price NUMERIC,
  publication_date DATE,
  deadline_date DATE,
  creative_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add order_id and admin approval columns to campaign_media_proofs
ALTER TABLE public.campaign_media_proofs 
ADD COLUMN order_id UUID REFERENCES public.media_orders(id) ON DELETE SET NULL,
ADD COLUMN admin_status TEXT DEFAULT 'pending' CHECK (admin_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN admin_notes TEXT,
ADD COLUMN admin_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.media_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_portal_access
CREATE POLICY "Admins can manage portal access"
ON public.media_portal_access FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read own access by token"
ON public.media_portal_access FOR SELECT
USING (true);

-- RLS policies for media_orders
CREATE POLICY "Admins can manage all orders"
ON public.media_orders FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view orders for their campaigns"
ON public.media_orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaigns 
  WHERE campaigns.id = media_orders.campaign_id 
  AND campaigns.user_id = auth.uid()
));

CREATE POLICY "Public can read orders by outlet token"
ON public.media_orders FOR SELECT
USING (true);

CREATE POLICY "Public can update orders by outlet token"
ON public.media_orders FOR UPDATE
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_media_portal_access_updated_at
BEFORE UPDATE ON public.media_portal_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_orders_updated_at
BEFORE UPDATE ON public.media_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();