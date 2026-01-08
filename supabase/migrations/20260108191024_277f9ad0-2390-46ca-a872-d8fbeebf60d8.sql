-- Add a column to mark general guidelines that apply to all media types
ALTER TABLE public.sector_brain_examples 
ADD COLUMN IF NOT EXISTS is_general_guideline boolean DEFAULT false;

-- Add index for faster queries on general guidelines
CREATE INDEX IF NOT EXISTS idx_sector_brain_general_guidelines 
ON public.sector_brain_examples (is_general_guideline) 
WHERE is_general_guideline = true;