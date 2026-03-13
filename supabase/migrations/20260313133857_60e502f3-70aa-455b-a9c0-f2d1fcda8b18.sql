
-- Insert media products with prices from the spreadsheet
INSERT INTO media_products (outlet_id, name, name_he, product_type, base_price, client_price, target_audience, gender_target) VALUES
  -- הניה שוחט - משפיענית
  ('6a0fb9cf-e8e6-422a-bb4e-7ea8f7c3e3fd', 'Full Campaign', 'קמפיין מלא (צילום + עריכה + תזכורות)', 'influencer', 10900, 10900, 'חרדי', 'נשים'),
  
  -- חבילת ווצאפ
  ('811927a4-fe9b-49d7-b47b-b1a80762a13a', 'WhatsApp Distribution', 'הפצה בחבילת קבוצות', 'whatsapp', 2970, 2970, 'חרדי', 'כללי'),
  
  -- סטוריז בווצאפ
  ('8e0c7915-ee8f-4b5d-835b-7295ac9cad8d', 'Story Ad', 'פרסום בסטוריז', 'whatsapp', 3000, 3000, 'חרדי', 'כללי'),
  
  -- בתוך משפחה
  ('60a71125-8941-4e52-8bc7-686320dacecb', 'Full Page', 'עמוד מלא', 'print', 3500, 3500, 'חרדי', 'כללי'),
  
  -- מידע ירושלים
  ('75d80d54-8247-4dfa-b6ec-17da1856b966', 'Full Page', 'עמוד מלא', 'print', 1680, 1680, 'חרדי ירושלמי', 'כללי'),
  
  -- עיתון הר נוף
  ('6a9acc37-7b1c-43d1-a86f-84cd24328ba8', 'Ad Placement', 'מודעה', 'print', 800, 800, 'חרדי הר נוף', 'כללי'),
  
  -- לוח קיר
  ('2ebaf703-79d7-408f-b1ee-a7c96bad3704', 'Wall Board Ad', 'מודעה בלוח קיר', 'print', 770, 770, 'חרדי ירושלמי', 'כללי'),
  
  -- קול אשכול
  ('c6d27686-a42e-4ced-862e-8b872fb4583a', 'Ad Placement', 'מודעה', 'print', 750, 750, 'חרדי אשכול', 'כללי'),
  
  -- חזק - עמוד
  ('0b70c6ce-6e2a-48e1-bf4a-3c02d0a197b3', 'Full Page', 'עמוד מלא', 'print', 3800, 3800, 'חרדי', 'כללי'),
  
  -- חזק - חצי עמוד
  ('0b70c6ce-6e2a-48e1-bf4a-3c02d0a197b3', 'Half Page', 'חצי עמוד', 'print', 2100, 2100, 'חרדי', 'כללי'),
  
  -- קהילות רמות
  ('8a23e114-18ce-495b-819a-be9ce8df9c0b', 'Ad Placement', 'מודעה', 'print', 750, 750, 'חרדי רמות', 'כללי'),
  
  -- בעניינים בית שמש
  ('031e7ea1-6692-4013-b705-253f1cdad4c5', 'Ad Placement', 'מודעה', 'print', 590, 590, 'חרדי בית שמש', 'כללי'),
  
  -- אתר כל רגע
  ('78a703ca-8739-4f46-8c5f-e9bd9ba0e889', 'Monthly Campaign', 'קמפיין חודשי (באנרים + כתבות תוכן)', 'digital', 13000, 13000, 'חרדי', 'כללי'),
  
  -- את משלנו
  ('da5db3ea-64c5-4e92-bfbb-f85c62733b02', 'Single Distribution', 'הפצה בודדת', 'whatsapp', 600, 600, 'חרדי', 'נשים'),
  
  -- עכשיו תורך
  ('d1f1e2db-55fa-4156-ae9f-987d02c4ec49', 'Single Distribution', 'הפצה בודדת', 'whatsapp', 600, 600, 'חרדי', 'נשים'),
  
  -- ירושלמים אונליין
  ('b6dba62e-1bed-4175-a7b3-d689a6ebd89c', 'Single Distribution', 'הפצה בודדת', 'whatsapp', 500, 500, 'חרדי ירושלמי', 'כללי'),
  
  -- מידע י-ם ווצאפ
  ('c51187a9-3ea3-4963-8139-db69da0b7952', 'Single Distribution', 'הפצה בודדת', 'whatsapp', 550, 550, 'חרדי ירושלמי', 'כללי'),
  
  -- בית וגן
  ('aa72a63f-f771-4e78-995b-f0bdb6f7946d', 'Email + WhatsApp', 'הפצה במייל ובווצאפ', 'whatsapp', 500, 500, 'חרדי בית וגן', 'כללי'),
  
  -- אפרת פינקל
  ('cfeefa61-5abe-40ab-90f7-af1a819cc63e', 'Newsletter Ad', 'פרסום בניוזלייטר', 'newsletter', 600, 600, 'חרדי', 'נשים'),
  
  -- מגזין רגע
  ('845c1cac-37d8-4f60-a8c0-eaa7b4b08922', 'Full Page', 'עמוד מלא', 'print', 2472, 2472, 'חרדי', 'כללי'),
  
  -- טלי שטיין
  ('2cfe252a-900f-435a-b2af-058aa014d201', 'Email Campaign', 'קמפיין מייל', 'newsletter', 525, 525, 'חרדי', 'כללי'),
  
  -- אתר פרוג - חודש
  ('3bf8f09d-ac04-484e-9408-4752f223c71d', 'Monthly Campaign', 'קמפיין חודשי', 'digital', 12500, 12500, 'חרדי', 'כללי'),
  
  -- אתר פרוג - כתבה
  ('3bf8f09d-ac04-484e-9408-4752f223c71d', 'Content Article', 'כתבה תוכנית', 'digital', 2000, 2000, 'חרדי', 'כללי'),
  
  -- רדיו
  ('4984f543-d2fe-425b-aac7-bb89bd8a8ff1', '2 Week Campaign', 'קמפיין שבועיים', 'radio', 16500, 16500, 'חרדי', 'כללי');
