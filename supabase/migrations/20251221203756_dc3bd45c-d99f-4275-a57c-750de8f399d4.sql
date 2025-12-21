-- Add columns for text content and categorization
ALTER TABLE public.sector_brain_examples 
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS stream_type TEXT,
ADD COLUMN IF NOT EXISTS gender_audience TEXT;

-- Add check constraints for valid values
ALTER TABLE public.sector_brain_examples 
ADD CONSTRAINT valid_stream_type CHECK (stream_type IS NULL OR stream_type IN ('hasidic', 'litvish', 'general', 'sephardic'));

ALTER TABLE public.sector_brain_examples 
ADD CONSTRAINT valid_gender_audience CHECK (gender_audience IS NULL OR gender_audience IN ('male', 'female', 'hasidic_female', 'hasidic_male', 'youth', 'classic'));