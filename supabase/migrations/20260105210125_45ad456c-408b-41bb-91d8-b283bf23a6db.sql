-- Create table for AI model configurations per media type
CREATE TABLE public.ai_model_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  design_rules TEXT[],
  text_rules TEXT[],
  logo_instructions TEXT,
  color_usage_rules TEXT,
  typography_rules TEXT,
  layout_principles TEXT[],
  dos TEXT[],
  donts TEXT[],
  example_prompts TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(media_type)
);

-- Enable RLS
ALTER TABLE public.ai_model_configs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Authenticated users can view AI model configs"
ON public.ai_model_configs
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage AI model configs"
ON public.ai_model_configs
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create trigger for updated_at
CREATE TRIGGER update_ai_model_configs_updated_at
BEFORE UPDATE ON public.ai_model_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations for each media type
INSERT INTO public.ai_model_configs (media_type, model_name, display_name, description, system_prompt, design_rules, text_rules, logo_instructions, color_usage_rules, typography_rules, layout_principles, dos, donts, example_prompts)
VALUES 
(
  'print_ads',
  'google/gemini-2.5-flash-image-preview',
  'מודל מודעות דפוס',
  'מיועד ליצירת מודעות עיתון, מגזינים ופליירים',
  'אתה מעצב גרפי מומחה למודעות דפוס לקהילה החרדית. יצור מודעת דפוס מקצועית עם דגש על היררכיה ויזואלית ברורה, כותרת בולטת, ושטח לבן מאוזן. המודעה חייבת להיות נקיה, מכובדת ואפקטיבית.',
  ARRAY['שמירה על שטח לבן של לפחות 20% מהעיצוב', 'היררכיה ברורה: כותרת > תת-כותרת > גוף', 'מסגרת או גבול עדין להפרדה', 'לא יותר מ-3 צבעים עיקריים'],
  ARRAY['כותרת ראשית - מקסימום 5 מילים', 'תת-כותרת - משפט אחד קצר', 'גוף הטקסט - 2-3 שורות מקסימום', 'CTA ברור ובולט'],
  'הלוגו חייב להופיע בפינה הימנית עליונה או תחתונה, בגודל שלא עולה על 15% מהמודעה. יש לשמור על רווח נקי סביב הלוגו.',
  'השתמש בצבעי המותג כצבעים דומיננטיים. צבע ראשי לכותרת ו-CTA, צבע משני לאלמנטים תומכים.',
  'כותרות: פונט בולד גדול. גוף: פונט קריא בגודל 12-14 נקודות לפחות. מרווחי שורות נדיבים.',
  ARRAY['Z-pattern או F-pattern לקריאה', 'נקודת מוקד אחת ברורה', 'איזון אסימטרי מעניין', 'שימוש בריבועי זהב'],
  ARRAY['שימוש בתמונות איכותיות בלבד', 'פשטות - פחות זה יותר', 'CTA בולט וברור', 'עקביות עם שפת המותג'],
  ARRAY['יותר מדי טקסט צפוף', 'תמונות פנים של נשים', 'יותר מ-2 פונטים שונים', 'צבעים זועקים ללא צורך'],
  ARRAY['מודעה לעסק נדלן - מינימליסטית עם תמונת בניין יוקרתי', 'מודעת מכירה - כותרת בולטת עם אחוז הנחה ומסגרת צבעונית', 'מודעת אירוע - עיצוב חגיגי עם פרטי האירוע']
),
(
  'banners',
  'google/gemini-2.5-flash-image-preview',
  'מודל באנרים דיגיטליים',
  'מיועד ליצירת באנרים לאתרים, פייסבוק ורשתות חברתיות',
  'אתה מעצב באנרים דיגיטליים מקצועי. הבאנר חייב להיות eye-catching תוך 3 שניות, עם מסר ברור ו-CTA בולט. עיצוב מותאם לצפייה במסכים.',
  ARRAY['יחס גובה-רוחב מותאם לפלטפורמה', 'קונטרסט גבוה לקריאות', 'אלמנט אחד דומיננטי', 'גבולות safe zone'],
  ARRAY['מקסימום 7 מילים לכל הבאנר', 'CTA של 2-3 מילים', 'ללא טקסט קטן שלא ייקרא'],
  'הלוגו קטן ודיסקרטי בפינה, לא יותר מ-10% מהשטח. לעיתים אפשר לוותר עליו לטובת CTA.',
  'צבעים חיים ובולטים. רקע צבע אחיד או גרדיאנט פשוט. כפתור CTA בצבע קונטרסטי.',
  'פונט אחד בלבד, גדול וקריא. Bold לכותרת. ללא פונטים דקים.',
  ARRAY['מרכוז הודעה עיקרית', 'CTA בצד שמאל (לקריאה בעברית)', 'אנימציה עדינה אם רלוונטי'],
  ARRAY['פשטות מקסימלית', 'צבעים תואמים לפלטפורמה', 'בדיקת safe zones'],
  ARRAY['טקסט מעל 20% מהשטח', 'תמונות מורכבות מדי', 'אפקטים מיותרים'],
  ARRAY['באנר לידרבורד 728x90 לאתר חדשות', 'באנר פייסבוק 1200x628 לקמפיין', 'באנר מרובע לאינסטגרם']
),
(
  'signage',
  'google/gemini-2.5-flash-image-preview',
  'מודל שילוט חוצות',
  'מיועד ליצירת שלטי חוצות, ביגבורד ושילוט עירוני',
  'אתה מעצב שילוט חוצות מקצועי. השלט חייב להיות קריא ב-3 שניות מרחק של 100 מטר. פשטות מוחלטת, אות אחת גדולה, מסר אחד.',
  ARRAY['קריאות ממרחק - פונט ענק', 'מקסימום 3 אלמנטים ויזואליים', 'קונטרסט מקסימלי', 'ללא פרטים קטנים'],
  ARRAY['מקסימום 6 מילים!', 'מילים קצרות וחזקות', 'מספר טלפון גדול אם יש'],
  'הלוגו גדול ובולט - עד 25% מהשלט. זה שילוט מותג! הלוגו יכול להיות האלמנט הדומיננטי.',
  'צבעים פשוטים וחזקים. מקסימום 2 צבעים. קונטרסט כהה-בהיר חזק.',
  'פונט אחד בלבד, הכי בולד שיש. אותיות ענקיות.',
  ARRAY['מסר אחד מרכזי', 'לוגו + כותרת + CTA', 'תמונה רקע פשוטה אם בכלל'],
  ARRAY['מסר חד וחזק', 'קריאות בנהיגה', 'זכירות'],
  ARRAY['פרטים קטנים', 'יותר מ-6 מילים', 'רקעים עמוסים', 'צבעים דומים'],
  ARRAY['שלט ביגבורד לחנות רהיטים - שם + לוגו ענק', 'שילוט עירוני לאירוע - תאריך + שם אירוע', 'שלט ברכה לראש עיר - פורמלי ומכובד']
),
(
  'marketing_copy',
  'google/gemini-2.5-flash',
  'מודל קופי שיווקי',
  'מיועד לכתיבת סלוגנים, כותרות, תיאורי מוצר וטקסטים שיווקיים',
  'אתה קופירייטר מומחה לקהילה החרדית. כתוב טקסטים שיווקיים בעברית תקנית, משכנעים, ברורים ומכבדים. שפה חמה אך מקצועית.',
  ARRAY['N/A - זה מודל טקסט'],
  ARRAY['משפטים קצרים וחזקים', 'שימוש בפעלים אקטיביים', 'כתיבה בגוף שני', 'הימנעות מז׳רגון'],
  'אזכור שם המותג בטבעיות, לא בכפייה.',
  'N/A',
  'N/A',
  ARRAY['AIDA - תשומת לב, עניין, רצון, פעולה', 'בנפיט ראשון, פיצ׳ר שני'],
  ARRAY['לדבר בשפת הלקוח', 'להבטיח ולתת ערך', 'CTA ברור', 'שימוש בחיזוקים חברתיים'],
  ARRAY['הבטחות מופרזות', 'שפה גבוהה מדי', 'משפטים ארוכים', 'שלילה - להשתמש בחיוב'],
  ARRAY['סלוגן לרשת מזון כשר', 'תיאור מוצר לחנות אונליין', 'כותרת למודעת דרושים']
),
(
  'promo',
  'google/gemini-2.5-flash-image-preview',
  'מודל קד"מ ומבצעים',
  'מיועד לעיצוב חומרי קידום מכירות, קופונים ומבצעים',
  'אתה מעצב חומרי קד"מ ומבצעים. עיצובים שזועקים "מבצע!" עם מספרים בולטים, תחושת דחיפות וקריאה לפעולה מיידית.',
  ARRAY['מספרים גדולים ובולטים', 'צבעים חמים ואנרגטיים', 'אלמנטים של דחיפות', 'תגיות ובאדג׳ים'],
  ARRAY['% הנחה בולט', 'תנאי המבצע ברורים', 'תאריך סיום', 'CTA דחוף'],
  'הלוגו נוכח אך המבצע דומיננטי. הלקוח צריך לזכור את ההטבה ואז את המותג.',
  'אדום, כתום, צהוב - צבעי מבצע קלאסיים. אפשר לשלב עם צבעי המותג.',
  'מספרים ענקיים. אחוז ההנחה הכי גדול בעמוד.',
  ARRAY['מספר/הנחה במרכז', 'תנאים בקטן למטה', 'CTA בולט'],
  ARRAY['יצירת דחיפות', 'מספרים ספציפיים', 'פשטות ההצעה'],
  ARRAY['תנאים מוסתרים', 'יותר מדי הצעות', 'עיצוב משעמם'],
  ARRAY['קופון 50% הנחה לחנות בגדים', 'פליירעם קנה 1 קבל 1', 'מבצע סוף עונה']
),
(
  'radio',
  'google/gemini-2.5-flash',
  'מודל ספוטים לרדיו',
  'מיועד לכתיבת תסריטים לספוטים רדיופוניים וג׳ינגלים',
  'אתה כותב ספוטים לרדיו לקהילה החרדית. כתוב תסריטים קצרים וקליטים, עם מקצב נעים לאוזן, שמתאימים ל-30-60 שניות שידור.',
  ARRAY['N/A - זה מודל אודיו/טקסט'],
  ARRAY['משפטים קצרצרים', 'חזרות לזכירות', 'ג׳ינגל קליט', 'CTA בסוף'],
  'שם המותג מוזכר 2-3 פעמים בספוט באופן טבעי.',
  'N/A',
  'N/A',
  ARRAY['פתיחה תופסת', 'גוף מידע', 'סיום עם CTA ושם'],
  ARRAY['מקצב מדובר טבעי', 'הומור עדין אם מתאים', 'פרטי התקשרות ברורים'],
  ARRAY['יותר מדי מידע', 'קצב מהיר מדי', 'שפה כתובה במקום מדוברת'],
  ARRAY['ספוט 30 שניות לחנות מזון', 'ג׳ינגל לתחנת רדיו חרדית', 'מודעת דרושים לרדיו']
);

-- Create table to log AI generations for learning
CREATE TABLE public.ai_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  client_profile_id UUID REFERENCES public.client_profiles(id),
  media_type TEXT NOT NULL,
  model_config_id UUID REFERENCES public.ai_model_configs(id),
  prompt_used TEXT NOT NULL,
  generated_output TEXT,
  generation_type TEXT NOT NULL, -- 'image', 'text'
  success BOOLEAN NOT NULL DEFAULT true,
  user_feedback TEXT, -- 'good', 'bad', 'regenerate'
  feedback_notes TEXT,
  brand_context JSONB,
  campaign_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own generation logs"
ON public.ai_generation_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can create their own generation logs"
ON public.ai_generation_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all generation logs"
ON public.ai_generation_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));