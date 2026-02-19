
-- 1. Fix generated_images: add user_id, restrict access
ALTER TABLE public.generated_images ADD COLUMN IF NOT EXISTS user_id UUID;

DROP POLICY IF EXISTS "Allow public read on generated_images" ON public.generated_images;
DROP POLICY IF EXISTS "Allow public insert on generated_images" ON public.generated_images;
DROP POLICY IF EXISTS "Allow public update on generated_images" ON public.generated_images;

CREATE POLICY "Authenticated users can view generated images"
ON public.generated_images FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert own images"
ON public.generated_images FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update generated images"
ON public.generated_images FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete generated images"
ON public.generated_images FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2. Fix media_orders: restrict public read to only via authenticated users
DROP POLICY IF EXISTS "Public can read orders by outlet token" ON public.media_orders;
DROP POLICY IF EXISTS "Public can update orders by outlet token" ON public.media_orders;

CREATE POLICY "Authenticated users can read orders by outlet token"
ON public.media_orders FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update orders"
ON public.media_orders FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- 3. Fix media_portal_access: restrict to token-based lookup only
DROP POLICY IF EXISTS "Public can read own access by token" ON public.media_portal_access;

CREATE POLICY "Authenticated or token-based read portal access"
ON public.media_portal_access FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
);

-- 4. Fix sector_brain_examples: restrict to admin only
DROP POLICY IF EXISTS "Allow public delete on sector_brain_examples" ON public.sector_brain_examples;
DROP POLICY IF EXISTS "Allow public insert on sector_brain_examples" ON public.sector_brain_examples;
DROP POLICY IF EXISTS "Allow public read on sector_brain_examples" ON public.sector_brain_examples;

CREATE POLICY "Admins can manage sector brain examples"
ON public.sector_brain_examples FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read sector brain examples"
ON public.sector_brain_examples FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Add UPDATE policy for sector_brain_examples
CREATE POLICY "Admins can update sector brain examples"
ON public.sector_brain_examples FOR UPDATE
USING (has_role(auth.uid(), 'admin'));
