-- Add media_type column to sector_brain_examples
ALTER TABLE public.sector_brain_examples 
ADD COLUMN media_type text;

-- Add example_type column to distinguish between good examples and red lines
ALTER TABLE public.sector_brain_examples 
ADD COLUMN example_type text DEFAULT 'good';