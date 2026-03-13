
-- Insert media outlets
-- Newspapers & Locals
INSERT INTO media_outlets (name, name_he, category_id, city, stream, reach_info, vibe_he) VALUES
  ('Mida Yerushalayim', 'מידע ירושלים', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'ירושלים', 'חרדי', 'מקומון ירושלמי מוביל', 'מקומון שבועי מקצועי'),
  ('Iton Har Nof', 'עיתון הר נוף', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'ירושלים', 'חרדי', 'מקומון שכונתי הר נוף', 'מקומון שכונתי'),
  ('Luach Kir', 'לוח קיר', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'ירושלים', 'חרדי', 'מקומון קיר נפוץ', 'לוח קיר מודפס'),
  ('Kol Eshkol', 'קול אשכול', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'ירושלים', 'חרדי', 'מקומון שכונת אשכול', 'מקומון שכונתי'),
  ('Hazak', 'חזק', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'ירושלים', 'חרדי', 'עיתון חרדי מוביל', 'עיתון שבועי מוביל'),
  ('Kehilot Ramot', 'קהילות רמות', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'ירושלים', 'חרדי', 'מקומון שכונת רמות', 'מקומון שכונתי'),
  ('Beinyanim Beit Shemesh', 'בעניינים בית שמש', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', 'בית שמש', 'חרדי', 'מקומון בית שמש', 'מקומון שבועי'),
  ('Betoch Mishpacha', 'בתוך משפחה', 'b668b5ad-cdfe-4da1-8886-45373b0f2c5b', NULL, 'חרדי', 'עיתון משפחתי ארצי', 'עיתון שבועי משפחתי');

-- Magazines
INSERT INTO media_outlets (name, name_he, category_id, stream, reach_info, vibe_he) VALUES
  ('Magazine Rega', 'מגזין רגע', 'be6c1e01-4b1b-43b6-b11a-02ac3e2ce8ab', 'חרדי', 'מגזין חרדי מוביל', 'מגזין שבועי איכותי');

-- WhatsApp groups
INSERT INTO media_outlets (name, name_he, category_id, city, stream, reach_info, vibe_he) VALUES
  ('WhatsApp Bundle', 'חבילת ווצאפ (המוקד, צאפ מגזין, המיטב, סקופים, הקו החרדי)', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', NULL, 'חרדי', 'חבילת 6 קבוצות ווצאפ מובילות', 'הפצה בקבוצות ווצאפ מרכזיות'),
  ('WhatsApp Stories', 'סטוריז בווצאפ', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', NULL, 'חרדי', 'סטוריז בקבוצות ווצאפ', 'פרסום בסטוריז ווצאפ'),
  ('At Mishlanu', 'את משלנו - הניה בל', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', NULL, 'חרדי', 'קבוצת ווצאפ נשית', 'קבוצת ווצאפ נשית איכותית'),
  ('Achshav Torech', 'עכשיו תורך - יונת קפלן', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', NULL, 'חרדי', 'הפצה בקהילות ווצאפ', 'הפצה בקהילות ווצאפ נשיות'),
  ('Yerushalmiim Online', 'ירושלמים אונליין', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', 'ירושלים', 'חרדי', 'קבוצות ווצאפ ירושלמיות', 'הפצה בקבוצות ירושלמיות'),
  ('Mida Yerushalayim WhatsApp', 'מידע י-ם ווצאפ', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', 'ירושלים', 'חרדי', 'קבוצות ווצאפ ירושלמיות', 'הפצה בקבוצות ירושלמיות'),
  ('Beit Vagan WhatsApp', 'פרסום במייל ובוואצאפ בית וגן', 'f9557d79-7b1c-4d28-bc4f-98a51f83e2fc', 'ירושלים', 'חרדי', 'קהילת בית וגן', 'הפצה קהילתית בית וגן');

-- Digital
INSERT INTO media_outlets (name, name_he, category_id, stream, reach_info, vibe_he) VALUES
  ('Kol Rega Website', 'אתר כל רגע', 'd693ef0d-19c2-4420-b3b8-7c051524887a', 'חרדי', 'אתר חדשות חרדי מוביל - באנרים וכתבות תוכן', 'אתר חדשות ותוכן מוביל'),
  ('Prog Website', 'אתר פרוג', 'd693ef0d-19c2-4420-b3b8-7c051524887a', 'חרדי', 'אתר תוכן חרדי', 'אתר תוכן ופרסום');

-- Newsletters & Email
INSERT INTO media_outlets (name, name_he, category_id, stream, reach_info, vibe_he) VALUES
  ('Efrat Finkel Newsletter', 'אפרת פינקל ניוזלייטר', '5451b0ef-49f2-4fce-bcb8-f12b18fb605c', 'חרדי', 'ניוזלייטר לקהל נשי', 'ניוזלייטר נשי איכותי'),
  ('Tali Shtein Email', 'פרסום במייל - טלי שטיין', '5451b0ef-49f2-4fce-bcb8-f12b18fb605c', 'חרדי', 'רשימת תפוצה במייל', 'מיילים מקצועיים');

-- Influencers
INSERT INTO media_outlets (name, name_he, category_id, stream, reach_info, vibe_he) VALUES
  ('Henia Shochat', 'הניה שוחט', 'd7efafc9-00e1-40da-856c-3ef32d3c12d7', 'חרדי', 'משפיענית חרדית מובילה - צילום, עריכה, תזכורות', 'משפיענית תוכן מובילה');

-- Radio
INSERT INTO media_outlets (name, name_he, category_id, stream, reach_info, vibe_he) VALUES
  ('Radio Campaign', 'פרסום ברדיו', 'b27c44d2-11c0-478f-a9a3-83652c220596', 'חרדי', 'קמפיין רדיו שבועיים', 'שידור רדיו חרדי');
