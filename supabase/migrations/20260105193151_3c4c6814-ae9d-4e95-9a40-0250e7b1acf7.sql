-- Add holiday/season column to sector_brain_examples
ALTER TABLE public.sector_brain_examples 
ADD COLUMN holiday_season text;