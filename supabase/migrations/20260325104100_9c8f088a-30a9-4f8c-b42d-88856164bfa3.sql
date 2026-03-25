
CREATE TABLE public.campaign_final_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending_approval',
  admin_notes TEXT,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_final_package_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.campaign_final_packages(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES public.media_outlets(id),
  product_id UUID REFERENCES public.media_products(id),
  spec_id UUID REFERENCES public.product_specs(id),
  outlet_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  spec_name TEXT,
  dimensions TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  publication_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_final_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_final_package_items ENABLE ROW LEVEL SECURITY;

-- Users can view final packages for their own campaigns
CREATE POLICY "Users can view own final packages"
  ON public.campaign_final_packages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_final_packages.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

-- Users can update status (approve/reject) on their own packages
CREATE POLICY "Users can update own final packages"
  ON public.campaign_final_packages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_final_packages.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

-- Admins can do everything
CREATE POLICY "Admins can manage final packages"
  ON public.campaign_final_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can view items for their own packages
CREATE POLICY "Users can view own package items"
  ON public.campaign_final_package_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaign_final_packages fp
    JOIN public.campaigns c ON c.id = fp.campaign_id
    WHERE fp.id = campaign_final_package_items.package_id
    AND c.user_id = auth.uid()
  ));

-- Admins can manage all items
CREATE POLICY "Admins can manage package items"
  ON public.campaign_final_package_items FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
