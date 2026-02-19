
-- Add missing media categories
INSERT INTO media_categories (name, name_he, sort_order) VALUES
  ('daily_press', 'עיתונות יומית', 0),
  ('weekend_news', 'חדשות סוף שבוע', 1),
  ('magazines', 'מגזינים (כרומו)', 3),
  ('women_magazines', 'מגזיני נשים', 4),
  ('email_marketing', 'דיוור ישיר (מייל)', 7),
  ('whatsapp', 'וואטסאפ (הפצה)', 8),
  ('influencers_women', 'אושיות - נשים', 9),
  ('influencers_men', 'אושיות - גברים', 10),
  ('outdoor', 'חוצות', 11)
ON CONFLICT DO NOTHING;

-- Add missing cities
INSERT INTO media_cities (name, name_he, is_active) VALUES
  ('national', 'ארצי', true),
  ('telzstone', 'טלזסטון', true),
  ('ramot', 'רמות', true),
  ('lod', 'לוד', true),
  ('netanya', 'נתניה', true),
  ('haifa', 'חיפה', true),
  ('rechasim', 'רכסים', true),
  ('karmiel', 'כרמיאל', true),
  ('tiberias_area', 'טבריה והסביבה', true),
  ('tzfat_meron', 'צפת/מירון', true),
  ('nahariya', 'נהריה/כרמיאל/עכו', true),
  ('kiryat_gat', 'קרית גת', true),
  ('netivot_ofakim', 'נתיבות/אופקים', true),
  ('south_general', 'דרום כללי', true),
  ('ashkelon', 'אשקלון', true),
  ('rehovot', 'רחובות', true),
  ('hadera', 'חדרה', true),
  ('kiryat_ata', 'קרית אתא', true)
ON CONFLICT DO NOTHING;
