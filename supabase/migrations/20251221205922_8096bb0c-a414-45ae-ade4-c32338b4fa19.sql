-- Add vibe/restriction field to media_outlets
ALTER TABLE public.media_outlets 
ADD COLUMN vibe TEXT,
ADD COLUMN vibe_he TEXT,
ADD COLUMN warning_text TEXT,
ADD COLUMN reach_info TEXT;

-- Add target_audience to products
ALTER TABLE public.media_products
ADD COLUMN target_audience TEXT,
ADD COLUMN special_tag TEXT;