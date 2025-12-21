-- Media Categories (Level 1)
CREATE TABLE public.media_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_he TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Media Outlets (Level 2)
CREATE TABLE public.media_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.media_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_he TEXT,
  sector TEXT CHECK (sector IN ('litvish', 'chassidish', 'sefardi', 'general')),
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Media Products (Level 3)
CREATE TABLE public.media_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.media_outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_he TEXT,
  product_type TEXT NOT NULL,
  requires_text BOOLEAN DEFAULT false,
  requires_image BOOLEAN DEFAULT true,
  base_price NUMERIC DEFAULT 0,
  client_price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Specs (Level 4)
CREATE TABLE public.product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.media_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_he TEXT,
  dimensions TEXT,
  allowed_content TEXT[] DEFAULT '{}',
  base_price NUMERIC DEFAULT 0,
  client_price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cities table for local media
CREATE TABLE public.media_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_he TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_cities ENABLE ROW LEVEL SECURITY;

-- Public read access for all
CREATE POLICY "Public can read categories" ON public.media_categories FOR SELECT USING (true);
CREATE POLICY "Public can read outlets" ON public.media_outlets FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read products" ON public.media_products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read specs" ON public.product_specs FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read cities" ON public.media_cities FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage categories" ON public.media_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage outlets" ON public.media_outlets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage products" ON public.media_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage specs" ON public.product_specs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage cities" ON public.media_cities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_outlets_category ON public.media_outlets(category_id);
CREATE INDEX idx_products_outlet ON public.media_products(outlet_id);
CREATE INDEX idx_specs_product ON public.product_specs(product_id);
CREATE INDEX idx_outlets_sector ON public.media_outlets(sector);
CREATE INDEX idx_outlets_city ON public.media_outlets(city);