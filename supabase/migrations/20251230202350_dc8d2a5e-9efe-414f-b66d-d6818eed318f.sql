-- Add topic category column to sector_brain_examples table
ALTER TABLE public.sector_brain_examples
ADD COLUMN topic_category text;