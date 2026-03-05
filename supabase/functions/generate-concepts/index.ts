import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Media type specific instructions
async function fetchSectorBrainFromDB(holidaySeason?: string | null, topicCategory?: string | null) {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const selectFields = 'name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type, file_path, file_type, is_general_guideline';
    let topicExamples: any[] = [];
    if (topicCategory) {
      const { data } = await supabase.from('sector_brain_examples').select(selectFields).eq('topic_category', topicCategory).eq('is_general_guideline', false).limit(30);
      topicExamples = data || [];
    }
    let holidayExamples: any[] = [];
    if (holidaySeason && holidaySeason !== 'year_round') {
      const { data } = await supabase.from('sector_brain_examples').select(selectFields).eq('holiday_season', holidaySeason).eq('is_general_guideline', false).limit(30);
      holidayExamples = data || [];
    }
    const remainingQuota = Math.max(10, 50 - topicExamples.length - holidayExamples.length);
    const generalQuery = supabase.from('sector_brain_examples').select(selectFields).eq('is_general_guideline', false).limit(remainingQuota);
    if (topicCategory) generalQuery.or(`topic_category.is.null,topic_category.neq.${topicCategory}`);
    if (holidaySeason && holidaySeason !== 'year_round') generalQuery.or(`holiday_season.is.null,holiday_season.eq.year_round`);
    const { data: generalData, error } = await generalQuery;
    if (error) return null;

    // Fetch Guidelines
    const { data: guidelinesData } = await supabase.from('sector_brain_examples').select('text_content').eq('is_general_guideline', true).limit(20);
    const guidelines = (guidelinesData || []).map(g => g.text_content).filter(Boolean);

    // Fetch saved AI Insights
    let insightsQuery = supabase.from('sector_brain_insights').select('insight_type, content').eq('is_active', true).order('updated_at', { ascending: false }).limit(10);
    if (topicCategory) {
      insightsQuery = supabase.from('sector_brain_insights').select('insight_type, content').eq('is_active', true).or(`insight_type.eq.general,insight_type.eq.visual_patterns,insight_type.eq.creative_correction,insight_type.eq.topic_${topicCategory}`).order('updated_at', { ascending: false }).limit(10);
    }
    const { data: insightsData } = await insightsQuery;
    const insights = (insightsData || []).map(i => `[${i.insight_type}]: ${i.content?.substring(0, 2000)}`);

    const seen = new Set<string>();
    const allExamples: any[] = [];
    for (const item of [...topicExamples, ...holidayExamples, ...(generalData || [])]) {
      if (!seen.has(item.name)) { seen.add(item.name); allExamples.push(item); }
    }
    if (!allExamples.length && !guidelines.length && !insights.length) return null;
    const grouped: Record<string, typeof allExamples> = {};
    for (const item of allExamples) { const zone = item.zone || 'general'; if (!grouped[zone]) grouped[zone] = []; grouped[zone].push(item); }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const imageExamples = allExamples
      .filter(e => e.file_path && e.file_type && /image|png|jpg|jpeg|webp/i.test(e.file_type))
      .slice(0, 8)
      .map(e => `${supabaseUrl}/storage/v1/object/public/sector-brain/${e.file_path}`);
    return { total_examples: allExamples.length, topic_specific_count: topicExamples.length, topic: topicCategory || null, holiday_specific_count: holidayExamples.length, holiday: holidaySeason || null, zones: grouped, imageUrls: imageExamples, guidelines, insights };
  } catch { return null; }
}

const MEDIA_TYPE_INSTRUCTIONS: Record<string, { name: string; format: string; example: string }> = {
  radio: {
    name: 'רדיו',
    format: 'תסריט ספוט רדיו של 30 שניות עם הנחיות לקריין',
    example: 'תסריט קצר וקליט עם הנחיות להטעמה, קצב ומוזיקה מומלצת'
  },
  ad: {
    name: 'מודעות עיתונות',
    format: 'כותרת + תת-כותרת + גוף טקסט קצר + קריאה לפעולה',
    example: 'טקסט מודעה עם היררכיה ברורה לפרסום בעיתונים ומגזינים'
  },
  banner: {
    name: 'באנר דיגיטלי',
    format: 'כותרת קצרה וקליטה + קריאה לפעולה',
    example: 'טקסט מינימלי ותמציתי שעובד בגדלים קטנים'
  },
  billboard: {
    name: 'שלט חוצות',
    format: 'משפט אחד חזק ובולט + לוגו',
    example: 'מסר קצר שנקרא ב-3 שניות מרכב נוסע'
  },
  social: {
    name: 'סושיאל מדיה',
    format: 'כיתוב לפוסט + האשטגים + קריאה לפעולה',
    example: 'טקסט מעורר עניין שמתאים לוואטסאפ, פייסבוק וניוזלטר'
  },
  all: {
    name: 'קמפיין 360°',
    format: 'מסר מרכזי שמתאים לכל הפלטפורמות',
    example: 'רעיון שיכול להתפרש למודעה, באנר, שלט חוצות ורדיו'
  }
};

const HOLIDAY_LABELS: Record<string, string> = {
  pesach: 'פסח',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  shavuot: 'שבועות',
  lag_baomer: 'ל"ג בעומר',
  tu_bishvat: 'ט"ו בשבט',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  year_round: 'כל השנה',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { profile, mediaType, campaignBrief, holidaySeason, topicCategory, strategicAnalysis, designApproach } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const mediaInfo = MEDIA_TYPE_INSTRUCTIONS[mediaType || 'ad'];
    const isRadio = mediaType === 'radio';
    const holidayName = holidaySeason && holidaySeason !== 'year_round' ? HOLIDAY_LABELS[holidaySeason] : null;

const systemPrompt = `אתה קריאייטיב דירקטור בכיר במשרד פרסום מוביל. אתה ידוע בכותרות חזקות, שנונות, עם משחקי מילים חכמים — אבל גם ביכולת לגעת ברגש.

=== כלל עליון: דבר אל הלקוח, לא על המוצר ===
כל כותרת חייבת לדבר ישירות אל מי שקורא אותה. לא תיאור שירות — אלא פנייה לרגש, לכאב, לחלום, לרצון.
לפני כל כותרת, שאל:
1. מי קורא את זה? (אישה חרדית? בעל עסק? אבא לפני חג?)
2. מה הוא/היא מרגיש/ה עכשיו? (לחץ? רצון להתפנק? חיפוש פתרון?)
3. מה הוא/היא רוצה להרגיש אחרי? (ביטחון, שמחה, גאווה, רוגע, נחת)
4. איך המוצר נותן לו/לה את ההרגשה הזו?

דוגמאות — שטוח מול רגשי:
❌ "טיפולי פנים מקצועיים" → ✅ "כי מגיע לך להרגיש מושלמת — גם ביום רגיל"
❌ "מרפאת שיניים מתקדמת" → ✅ "בלי לחשוב פעמיים לפני שאתה מחייך"
❌ "קייטרינג לאירועים" → ✅ "השולחן שמפגיש את כל המשפחה — בלי שתצטרכי לעמוד כל היום במטבח"
❌ "דירות למכירה" → ✅ "הרגע שהילדים אומרים 'הביתה' ומתכוונים למקום ששלכם"
בהקשר חרדי: הדגש רגעים משפחתיים (שולחן שבת, אירוע, חג), כבוד עצמי, שמחה פנימית, נחת.

=== כלל קריטי: עיבוד הבריף — לעולם אל תעתיק! ===
אל תעתיק את הבריף של הלקוח כפי שהוא. עבד אותו למסר שיווקי חד ומקצועי.
- כותרת משנה (Subheadline): חייבת להיות קצרה וממוקדת — עד 8 מילים בלבד. היא צריכה לתפקד כסלוגן משלים, לא כסיכום של הבריף.
- אם המשפט ארוך — חלק אותו ל-2 שורות קצרות וקולעות.
- דוגמה: אם הבריף הוא "מבצע על מטבחים 20% הנחה", הכותרת תהיה "המטבח שחלמת עליו" וכותרת המשנה תהיה "עכשיו ב-20% הנחה בלעדית".
- דוגמה נוספת: אם הבריף הוא "טיפולי שיניים מקצועיים במחיר מיוחד", הכותרת תהיה "החיוך שתמיד רצית" וכותרת המשנה תהיה "עכשיו במחיר שמחייך".
- בדיקה עצמית: "האם כותרת המשנה נשמעת כמו סלוגן חד, או כמו משפט מתוך הבריף?" — אם היא נשמעת כמו הבריף, תשכתב.
===

כללי ברזל נוספים:
- כל כותרת חייבת להיות קצרה, בועטת, בלתי נשכחת — כמו כותרת עיתון שעוצרת אנשים ברחוב
- חפש תמיד משחק מילים, ביטוי מפתיע, טוויסט, מטאפורה חכמה, או ניגוד מעניין
- הכותרות צריכות להיות חזקות באופן כללי — משחקי מילים בעברית, טוויסטים חכמים, מטאפורות מפתיעות
  דוגמאות: "חלון שמתגשם" (נדל"ן), "הפה שלך. הבמה שלנו." (שיניים), "טעם שלא שוכחים. גם כשהצלחת ריקה." (מזון)
- ניואנסים מהמקורות (תורה, גמרא, חז"ל) הם אפשרות אחת מתוך כמה — השתמש בהם רק כשזה מתחבר טבעי
- אסור קלישאות גנריות כמו "הכי טוב", "מקצועי ואיכותי", "שירות מעולה" - אלה כותרות עצלניות
- כל קונספט חייב לגרום לקורא לחייך, להתרגש, או לעצור ולקרוא שוב
- שפה תקנית וגבוהה, אבל לא מיושנת — חיה, קצבית, עם אנרגיה

=== גארדריילס: התאמה לקהל חרדי ===
הקריאייטיב חייב תמיד להתאים לקהל חרדי. חופש יצירתי מלא — בתנאי שלא פוגע:
- אסור לשון מעוררת, דאבל-אנטנדר מיני, רמזים בוטים
- אסור הומור שמלגלג על דת, רבנים, מנהגים, או קהילות
- אסור שפה אגרסיבית או מתריסה כלפי המסורת
- אסור נושאים רגישים (פוליטיקה, מחלוקות בין זרמים, צניעות)
- מותר הומור חם, חכם, ונעים. מותר שנינות. מותר להפתיע. אסור לפגוע.
===

${holidayName ? `
=== הקשר חג: ${holidayName} — חובה לשלב ניואנסים מגזריים! ===
זה לא מספיק לכתוב "לקראת ${holidayName}". חייבים ניואנסים אמיתיים מהחיים החרדיים:

${holidaySeason === 'pesach' ? `פסח — ניואנסים חרדיים ספציפיים לשימוש:
- "לצאת מהמצרים" (מצרים = מיצרים, גבולות) — משחק מילים קלאסי
- "מה נשתנה" — ניתן לעשות טוויסט עם המוצר/שירות
- "בכל דור ודור חייב אדם לראות את עצמו כאילו הוא יצא ממצרים" — חיבור אישי
- "דיינו" — אפשר להשתמש לומר "עד עכשיו הסתפקתם ב... דיינו? לא! מגיע לכם יותר"
- ניקיון פסח, מכירת חמץ, שריפת חמץ, קמחא דפסחא
- "עבדים היינו" — "עבדים היינו לפרסום יקר, עכשיו בני חורין"
- ליל הסדר, 4 כוסות, אפיקומן, הגדה, "מנהג ישראל"
- הגעלת כלים, פסח כשר, מהדרין, "שמורה מכל משמר"
- קניות לחג, בגדי יו"ט, שולחן חג` : ''}
${holidaySeason === 'sukkot' ? `סוכות — ניואנסים:
- "ושמחת בחגך" — שימוש לקמפיינים של שמחה
- אושפיזין, ארבעת המינים, אתרוג מהודר, סכך, נענועים
- "חג האסיף" — אפשר לקשר ל"לאסוף" הזדמנויות/לקוחות
- שמחת בית השואבה, הקפות, חול המועד טיולים` : ''}
${holidaySeason === 'chanukah' ? `חנוכה — ניואנסים:
- "מוסיף והולך" — מושלם לקמפיינים של צמיחה/הנחות גדלות
- "נס גדול היה פה" — טוויסט עם המוצר
- 8 ימים של..., סופגניות, לביבות, חנוכיה, נרות, שמן זית
- "מעט מן האור דוחה הרבה מן החושך" — חיבור למותג שמאיר` : ''}
${holidaySeason === 'purim' ? `פורים — ניואנסים:
- "נהפוך הוא" — מושלם לטוויסט, הפתעות, מבצעים
- משלוח מנות, מתנות לאביונים, מגילה, תחפושות
- "ליהודים היתה אורה ושמחה" — שמחה גדולה
- עד דלא ידע, סעודת פורים, "לרווחה"` : ''}
${holidaySeason === 'rosh_hashana' || holidaySeason === 'yom_kippur' ? `ימים נוראים — ניואנסים:
- "כתיבה וחתימה טובה", "שנה טובה ומתוקה"
- תפוח בדבש, רימון, ראש דג, סימנים
- "המלך בשדה" — חודש אלול, קירבה
- תשובה, תפילה, צדקה — מעבירין את רוע הגזירה
- שופר, סליחות, "מי ייתן ותכתבו"` : ''}
${holidaySeason === 'shavuot' ? `שבועות — ניואנסים:
- "זמן מתן תורתנו", לימוד כל הלילה, מאכלי חלב
- "נעשה ונשמע", חירות אמיתית, הר סיני, מגילת רות` : ''}
${holidaySeason === 'bein_hazmanim' || holidaySeason === 'summer' ? `בין הזמנים/קיץ — ניואנסים:
- יציאה מהכולל/ישיבה, זמן למשפחה
- טיולים כשרים, אטרקציות, בריכות מהודרות
- "בין הזמנים" — ביטוי ייחודי לחרדים, לא "חופש גדול"
- נופש משפחתי, צימרים, "להעלות את הסוללות"` : ''}
=== סוף הקשר חג ===
` : ''}

אתה יוצר קונספטים עבור: ${mediaInfo.name}
פורמט נדרש: ${mediaInfo.format}
דוגמה: ${mediaInfo.example}

=== כלל קריטי: ניטרליות חגים מוחלטת ===
כשאין חג ספציפי (holidaySeason ריק או 'year_round'), חל איסור מוחלט על שילוב סמלים דתיים או פולחניים בהצעת הויזואל:
❌ אסור: חנוכייה, גביע קידוש, שופר, קערת סדר, לולב, מגילה, נרות שבת
✅ מותר: אלמנטים שקשורים ישירות למוצר/שירות בלבד
שילוב סמל דתי במודעה שלא קשורה לחג = טעות מקצועית חמורה.
===

CRITICAL — למד מהרפרנסים:
אם מצורפים רפרנסים מ-Sector Brain (דוגמאות מוצלחות), לימד מהם את:
- סגנון הכותרות (האם הם שנוניים? משחקי מילים? ציטוטי חז"ל?)
- רמת היצירתיות (האם יש טוויסט מפתיע? הומור עדין?)
- אורך הטקסט והטון
- השתמש בהם כהשראה, אל תעתיק — תצור משהו חדש באותה רמה

=== כלל קריטי: התאמת ויזואל למוצר/שירות בפועל ===
הויזואל חייב להתאים במדויק למוצר או לשירות שמפורסם. אסור "החלקה" בין תחומים קרובים:
- טיפול פנים ≠ שיניים. קוסמטיקה = פנים, עור, קרמים. לא כלים דנטליים.
- רופא עיניים ≠ רופא שיניים ≠ רופא כללי. כל אחד עם הכלים שלו בלבד.
- מסעדה ≠ קייטרינג ≠ סופרמרקט. אוכל מוגמר ≠ מדפים ≠ שירות אירועים.
- נדל"ן מגורים ≠ נדל"ן מסחרי ≠ שיפוצים. בניין ≠ משרד ≠ פטיש.
כלל: "האם לקוח שרואה את התמונה מבין מיד מה השירות?" אם לא — תחליף.
===

=== כלל קריטי ביותר: התאמה מגדרית בין טקסט לוויזואל (GENDER-VISUAL LOCK) ===
זהו חוק ברזל שאסור להפר בשום מקרה! סתירה בין מגדר הטקסט לוויזואל = פסילה מיידית של המודעה.

כלל 1 — טקסט לנשים = ויזואל נשי:
אם הטקסט פונה בלשון נקבה (את, שלך, מגיע לך, הרגישי, תרגישי, מושלמת) או שהמוצר מיועד לנשים (טיפוח פנים לנשים, אופנת נשים, פאות, שמלות, קוסמטיקה נשית) — אסור בתכלית האיסור להציג דמות גברית בוויזואל!
❌ פדיחה קריטית: מודעה "מגיע לך להרגיש מושלמת" עם תמונה של גבר עם זקן
❌ פדיחה קריטית: מודעה לטיפולי פנים לנשים עם ויזואל של גבר חרדי
✅ נכון: מודעה לנשים עם עיצוב גרפי נקי (ללא דמויות) או מוצר בלבד
✅ נכון: מודעה לנשים עם אלמנטים נשיים (פרחים, קרמים, מראה, ספא)

כלל 2 — טקסט לגברים = ויזואל גברי:
אם הטקסט פונה בלשון זכר (אתה, שלך, מגיע לך, אבא) — הויזואל חייב להיות גברי או ניטרלי. אסור אלמנטים נשיים בולטים.

כלל 3 — בדיקה עצמית חובה:
לפני כל קונספט, שאל את עצמך:
1. למי הטקסט פונה? (זכר/נקבה/משפחה)
2. האם הוויזואל תואם את המגדר הזה?
3. אם יש דמות — האם המגדר שלה תואם ללשון הפנייה?
אם התשובה לאחד מהשאלות היא "לא" — תחליף את הוויזואל מיד!

כלל 4 — מוצר נשי עם הגבלת "ללא נשים":
כשהמוצר מיועד לנשים אבל אסור להציג נשים (כלל מגזרי):
- השתמש בעיצוב גרפי נקי (טיפוגרפיה + צבעים)
- השתמש בצילום מוצר (קרם, בושם, שמלה על מניקן)
- אסור בשום אופן להציג גבר במקום! גבר לא מחליף אישה — עדיף ויזואל ללא דמויות כלל.
===

Generate exactly 3 creative ${isRadio ? 'radio spot' : 'advertising'} concepts. Each concept has a DIFFERENT angle and tone:

=== קונספט 1: רגשי (emotional) ===
הכותרת חייבת לדבר ישירות ללב של הקורא/ת. לא לתאר את המוצר — אלא לגעת ברגש.
שאל: מה הלקוח/ה מרגיש/ה עכשיו? מה הוא/היא חולם/ת להרגיש?
דוגמאות כותרות רגשיות מצוינות:
- "כי מגיע לך להרגיש מושלמת — גם ביום רגיל" (טיפוח)
- "הרגע שהילדים אומרים 'הביתה' ומתכוונים למקום ששלכם" (נדל"ן)
- "השולחן שמפגיש את כל המשפחה — בלי שתצטרכי לעמוד כל היום במטבח" (קייטרינג)
הכותרת הרגשית צריכה להוביל עם רגש — אבל מותר לכלול מחיר או מבצע כפרט משני (למשל בגוף הטקסט או ב-CTA, לא בכותרת עצמה).

=== קונספט 2: מכירתי-מוצרי (hard-sale) ===
הכותרת חייבת להבליט את היתרון הספציפי של המוצר/שירות. לא "הכי טוב" — אלא מה בדיוק מייחד אותו.
שאל: מה הלקוח מקבל שהוא לא מקבל אצל המתחרים?
דוגמאות כותרות מוצריות מצוינות:
- "הפה שלך. הבמה שלנו." (שיניים — מדגיש תוצאה)
- "תוצאות שנראות כבר מהטיפול הראשון" (טיפוח — מדגיש מהירות)
- "3 חדרים. 90 מטר. 0 ויתורים." (נדל"ן — מדגיש ספציפיקציה + תועלת)
הכותרת המכירתית חייבת לכלול את ה-USP הספציפי, עם טוויסט שנון.

=== קונספט 3: כאב ופתרון / מפתיע (pain-point) ===
הכותרת חייבת להיות שנונה, יצירתית, מפתיעה — לגרום לקורא לחייך או לעצור ולקרוא שוב.
שאל: מה הכאב/הפחד/התסכול שהלקוח חי? איך אפשר להפוך אותו למשפט עוקצני?
דוגמאות כותרות מפתיעות מצוינות:
- "חלון שמתגשם" (נדל"ן — טוויסט על 'חלום שמתגשם')
- "טעם שלא שוכחים. גם כשהצלחת ריקה." (מזון — ניגוד מפתיע)
- "נמאס לחייך עם הפה סגור?" (שיניים — כאב אמיתי + הומור)
- "העור שלך זוכר הכל. הגיע הזמן לתת לו סיבה לחייך." (טיפוח — פרסונליזציה)
הכותרת המפתיעה חייבת להכיל לפחות אחד: משחק מילים, מטאפורה, ניגוד, או טוויסט בלתי צפוי.

IMPORTANT — כל 3 הכותרות חייבות להיות שונות לחלוטין בטון ובגישה!

=== כלל אורך טקסט (קריטי!) ===
- כותרת (headline): מקסימום 40 תווים (3-7 מילים). קצר, חד, בועט.
- ❌ אסור בכותרת: פסיקים, נקודות, סימני פיסוק מרובים. הכותרת היא טקסט ויזואלי — לא משפט דקדוקי.
  - ❌ לא: "לדבר, לצחוק, לברך. בפה מלא."
  - ✅ כן: "לדבר לצחוק לברך בפה מלא"
  - ✅ כן: "בפה מלא" (קצר ובועט)
- קופי/גוף (copy): מקסימום 80 תווים (~2-3 שורות קצרות). זה לא מאמר — זה מודעה!
- ❌ אסור: פסקאות ארוכות, 5+ שורות, הסברים מתישים
- ✅ נכון: משפט-שניים תמציתיים שמשלימים את הכותרת
===

Respond ONLY with valid JSON in this exact format:
{
  "concepts": [
    {
      "type": "emotional",
      "headline": "כותרת רגשית קצרה (עד 40 תווים)",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'קופי קצר עד 80 תווים — משפט-שניים בלבד'}"
    },
    {
      "type": "hard-sale",
      "headline": "כותרת מכירתית קצרה (עד 40 תווים)",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'קופי קצר עד 80 תווים — משפט-שניים בלבד'}"
    },
    {
      "type": "pain-point",
      "headline": "כותרת שנונה קצרה (עד 40 תווים)",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'קופי קצר עד 80 תווים — משפט-שניים בלבד'}"
    }
  ]
}`;

    // Campaign brief info
    const campaignTitle = campaignBrief?.title || '';
    const campaignOffer = campaignBrief?.offer || '';
    const campaignGoal = campaignBrief?.goal || '';

    const userPrompt = `Create 3 creative ${isRadio ? 'radio spot' : 'advertising'} concepts for this business:

Business Name: ${profile.business_name || 'עסק כללי'}
Target Audience: ${profile.target_audience || 'משפחות חרדיות'}
Main X-Factor/Unique Selling Point: ${profile.primary_x_factor || 'איכות ושירות'}
Winning Feature: ${profile.winning_feature || 'מקצועיות'}
Advantage Type: ${profile.advantage_type || 'שירות'}
All X-Factors: ${profile.x_factors?.join(', ') || 'איכות, מחיר, שירות'}

${campaignTitle || campaignOffer ? `
=== CAMPAIGN BRIEF - CRITICAL ===
${campaignTitle ? `Campaign Name: ${campaignTitle}` : ''}
${campaignOffer ? `MAIN OFFER/MESSAGE (MUST be the central focus of ALL concepts): ${campaignOffer}` : ''}
${campaignGoal ? `Campaign Goal: ${campaignGoal === 'promotion' ? 'Sale/Promotion — tone must be URGENT, direct, action-oriented. Prices/discounts must be prominent. Strong CTA.' : campaignGoal === 'awareness' ? 'Brand Awareness — tone must be ELEGANT, aspirational, inspiring. No hard sell. Short powerful brand-building headlines.' : campaignGoal === 'launch' ? 'Product Launch — tone must be DRAMATIC, surprising, exciting. Build curiosity. "Something new is coming" energy.' : campaignGoal === 'seasonal' ? 'Seasonal/Holiday — tone must be FESTIVE, warm, family-oriented. Connect to holiday atmosphere and traditions.' : campaignGoal}` : ''}

IMPORTANT: The main offer "${campaignOffer}" MUST appear prominently in each concept's copy and be the central message. Do not create generic brand concepts - focus specifically on this offer!
=================================
` : ''}

Media Type: ${mediaInfo.name}
Format: ${mediaInfo.format}

${isRadio ? `
IMPORTANT: For radio spots:
- Write complete 30-second scripts with clear narration text
- Include notes for the narrator (tone, emphasis, pacing)
- Suggest background music style if relevant
- Include a catchy opening and strong call-to-action ending
${campaignOffer ? `- The main message "${campaignOffer}" must be mentioned clearly at least twice in the script` : ''}
` : `
The visual concepts should speak directly to this audience and highlight what makes this business special.
Tailor the text length and style to fit ${mediaInfo.name}.
${campaignOffer ? `CRITICAL: The main offer "${campaignOffer}" must be the central element in the copy and visual description. Every concept must prominently feature this offer!` : ''}
`}
${holidayName ? `
=== HOLIDAY CONTEXT ===
This campaign is for ${holidayName}. Make sure the concepts reflect the atmosphere and themes of ${holidayName}.
Use appropriate symbols, greetings, and messaging for the season.
=======================
` : ''}
Remember: Each concept needs a different angle - one emotional, one hard-sale focused, and one addressing a pain point the audience has.
${campaignOffer ? `But ALL concepts must prominently feature the main offer: "${campaignOffer}"` : ''}
${strategicAnalysis ? `
=== ניתוח אסטרטגי מהסופר-אייג'נט ===
השתמש בתובנות הבאות כדי לחדד את הקונספטים:
${strategicAnalysis}
=== סוף ניתוח אסטרטגי ===
` : ''}
${designApproach ? `
=== גישה עיצובית שנבחרה: ${designApproach} ===
${designApproach === 'brand-follower' ? 'המשכיות מלאה — הוויזואל חייב לשמור על אותו סגנון, מבנה גריד, ושפה עיצובית כמו חומרי העבר של הלקוח. תאר ויזואל שמתאים בדיוק לקו העיצובי הקיים.' : ''}
${designApproach === 'visual-refresh' ? 'רענון ויזואלי — אותו מבנה גריד אבל שפה עיצובית חדשה ורעננה. תאר ויזואל עם מראה מודרני ומרענן תוך שמירה על המבנה המוכר.' : ''}
${designApproach === 'structural-flex' ? 'גמישות מבנית — שומרים על ה-DNA המותגי (צבעים, פונטים) אבל עם מבנה גריד חדש ושונה. תאר פריסה חדשנית.' : ''}
${designApproach === 'creative-freedom' ? 'חופש יצירתי מלא — עיצוב חדש לחלוטין ללא מגבלות של חומרי עבר. תאר ויזואל חדשני ויצירתי.' : ''}
===
` : ''}`;

    // Fetch sector brain references with holiday awareness
    const sectorBrainData = await fetchSectorBrainFromDB(holidaySeason || null, topicCategory || null);
    const sectorContext = sectorBrainData 
      ? `\n\n=== רפרנסים מ-Sector Brain (${sectorBrainData.total_examples} דוגמאות, ${sectorBrainData.holiday_specific_count || 0} ספציפיות ל"${holidayName || 'כל השנה'}") ===
למד מהדוגמאות האלה! שים לב לסגנון הכותרות, משחקי המילים, הטוויסטים. העלה את הרמה שלך לפחות לרמה הזאת:
${JSON.stringify(sectorBrainData.zones)}
דוגמאות מ-"hall_of_fame" = השראה חיובית. "red_lines" = מה לא לעשות.
בקמפיין עונתי — תעדיף את הדוגמאות הספציפיות לחג!
${sectorBrainData.guidelines?.length ? `\n=== כללי אצבע (Guidelines) — חובה! ===\n${sectorBrainData.guidelines.map((g: string, i: number) => `${i+1}. ${g}`).join('\n')}` : ''}
${sectorBrainData.insights?.length ? `\n=== תובנות AI מהמאגר ===\n${sectorBrainData.insights.join('\n\n')}` : ''}
=== סוף רפרנסים ===`
      : '';

    console.log('Generating concepts for:', profile.business_name, 'Media type:', mediaType, 'Campaign offer:', campaignBrief?.offer, 'Holiday:', holidayName, 'Sector brain examples:', sectorBrainData?.total_examples || 0);

    // Try primary model, then fallback model
    const modelsToTry = ['google/gemini-2.5-pro', 'openai/gpt-5-mini'];
    let response: Response | null = null;
    
    for (const tryModel of modelsToTry) {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: tryModel,
          max_completion_tokens: 8192,
          messages: [
            { role: 'system', content: systemPrompt + sectorContext },
            { role: 'user', content: sectorBrainData?.imageUrls?.length
              ? [
                  { type: 'text', text: userPrompt + '\n\nלהלן דוגמאות ויזואליות מוצלחות מה-Sector Brain. למד מהסגנון, הצבעוניות, הקומפוזיציה והטיפוגרפיה שלהן:' },
                  ...sectorBrainData.imageUrls.map((url: string) => ({ type: 'image_url', image_url: { url } }))
                ]
              : userPrompt
            }
          ],
        }),
      });

      if (response.ok) {
        console.log(`Model ${tryModel} succeeded`);
        break;
      }
      
      console.warn(`Model ${tryModel} returned ${response.status}, trying next...`);
      
      if (response.status === 429 || response.status === 402) break; // Don't retry rate/payment issues
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Instead of throwing, use fallback concepts
      console.warn(`AI Gateway returned ${response.status}, using fallback concepts`);
      const offer = campaignBrief?.offer || '';
      const biz = profile.business_name || 'העסק';
      const fallbackConcepts = {
        concepts: [
          {
            type: 'emotional',
            headline: holidayName ? `${holidayName} הזה, ${biz} מלווה אתכם` : `${biz} — כי מגיע לכם`,
            idea: isRadio 
              ? `ספוט רדיו חם${holidayName ? ` לקראת ${holidayName}` : ''} עבור ${biz}` 
              : `תמונה חמימה${holidayName ? ` באווירת ${holidayName}` : ''} של ${biz}`,
            copy: isRadio 
              ? `(קול קריין חם) "${biz}${holidayName ? ` ל${holidayName}` : ''} - ${offer || 'הבחירה הנכונה'}. התקשרו עכשיו!"` 
              : offer || `${biz}${holidayName ? ` — ${holidayName} הזה` : ''} — הבחירה הנכונה`
          },
          {
            type: 'hard-sale',
            headline: offer ? `${offer}!` : `${biz} — הזדמנות${holidayName ? ` ל${holidayName}` : ''}!`,
            idea: isRadio 
              ? `ספוט אנרגטי${holidayName ? ` ל${holidayName}` : ''} עם הצעה מיוחדת` 
              : `מודעה מכירתית${holidayName ? ` ל${holidayName}` : ''} עבור ${biz}`,
            copy: isRadio 
              ? `(קול קריין נמרץ) "${biz}! ${offer || 'הזדמנות מיוחדת'}${holidayName ? ` ל${holidayName}` : ''}! התקשרו עכשיו!"` 
              : offer || `${biz}${holidayName ? ` ל${holidayName}` : ''} — למהר לפני שנגמר!`
          },
          {
            type: 'pain-point',
            headline: `${profile.primary_x_factor || biz} — סוף לחיפושים`,
            idea: isRadio 
              ? `ספוט שמתחיל מהבעיה ומציע פתרון` 
              : `ויזואל של הפתרון ש-${biz} מציע`,
            copy: isRadio 
              ? `(קול קריין מבין) "נמאס לחפש? ${biz} - ${offer || profile.primary_x_factor || 'הפתרון המושלם'}. סוף סוף מישהו שמבין!"` 
              : offer || `${profile.primary_x_factor || biz} — סוף סוף מישהו שמבין`
          }
        ]
      };
      const fallbackWithIds = fallbackConcepts.concepts.map((c: any, i: number) => ({
        ...c,
        id: `${c.type}-${Date.now()}-${i}`,
        mediaType: mediaType || 'ad'
      }));
      return new Response(JSON.stringify({ concepts: fallbackWithIds }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Response length:', content?.length, 'First 500 chars:', content?.substring(0, 500));

    // Parse JSON from the response - with multiple fallback strategies
    let concepts;
    try {
      // Strategy 1: Extract JSON block from markdown code fence
      const codeFenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = codeFenceMatch ? codeFenceMatch[1] : content;
      
      // Strategy 2: Find the outermost JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Clean common AI JSON issues before parsing
        let cleaned = jsonMatch[0]
          .replace(/,\s*}/g, '}')        // trailing commas before }
          .replace(/,\s*]/g, ']')        // trailing commas before ]
          .replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : '') // remove control chars
          .replace(/\\'/g, "'");          // escaped single quotes
        
        concepts = JSON.parse(cleaned);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content for debugging:', content?.substring(0, 2000));
      
      // Strategy 3: Try to extract individual concept objects
      try {
        const conceptMatches = [...content.matchAll(/\{\s*"type"\s*:\s*"[^"]+"\s*,\s*"headline"\s*:\s*"[^"]*"/g)];
        if (conceptMatches.length >= 2) {
          // Found partial concepts, try to extract them individually
          const extractedConcepts = [];
          for (const match of conceptMatches) {
            const startIdx = match.index!;
            let braceCount = 0;
            let endIdx = startIdx;
            for (let i = startIdx; i < content.length; i++) {
              if (content[i] === '{') braceCount++;
              if (content[i] === '}') braceCount--;
              if (braceCount === 0) { endIdx = i + 1; break; }
            }
            try {
              const obj = JSON.parse(content.substring(startIdx, endIdx).replace(/,\s*}/g, '}'));
              extractedConcepts.push(obj);
            } catch { /* skip malformed individual concept */ }
          }
          if (extractedConcepts.length > 0) {
            concepts = { concepts: extractedConcepts };
            console.log('Recovered', extractedConcepts.length, 'concepts from partial JSON');
          }
        }
      } catch { /* ignore recovery failure */ }

      // Strategy 4: Use dynamic fallback based on campaign brief + holiday
      if (!concepts) {
        const offer = campaignBrief?.offer || '';
        const goal = campaignBrief?.goal || '';
        const biz = profile.business_name || 'העסק';
        
        concepts = {
          concepts: [
            {
              type: 'emotional',
              headline: holidayName ? `${holidayName} הזה, ${biz} מלווה אתכם` : `${biz} — כי מגיע לכם`,
              idea: isRadio 
                ? `ספוט רדיו חם${holidayName ? ` לקראת ${holidayName}` : ''} עבור ${biz}` 
                : `תמונה חמימה${holidayName ? ` באווירת ${holidayName}` : ''} של ${biz}`,
              copy: offer || `${biz}${holidayName ? ` — ${holidayName} הזה` : ''} — הבחירה הנכונה`
            },
            {
              type: 'hard-sale',
              headline: offer ? `${offer}!` : `${biz} — הזדמנות${holidayName ? ` ל${holidayName}` : ''}!`,
              idea: isRadio 
                ? `ספוט אנרגטי${holidayName ? ` ל${holidayName}` : ''} עם הצעה מיוחדת` 
                : `מודעה מכירתית${holidayName ? ` ל${holidayName}` : ''} עבור ${biz}`,
              copy: offer || `${biz}${holidayName ? ` ל${holidayName}` : ''} — למהר לפני שנגמר!`
            },
            {
              type: 'pain-point',
              headline: `${profile.primary_x_factor || biz} — סוף לחיפושים`,
              idea: isRadio 
                ? `ספוט שמתחיל מהבעיה ומציע פתרון` 
                : `ויזואל של הפתרון ש-${biz} מציע`,
              copy: offer || `${profile.primary_x_factor || biz} — סוף סוף מישהו שמבין`
            }
          ]
        };
      }
    }

    // Add IDs and media type to concepts
    const conceptsWithIds = concepts.concepts.map((c: any, i: number) => ({
      ...c,
      id: `${c.type}-${Date.now()}-${i}`,
      mediaType: mediaType || 'ad'
    }));

    return new Response(JSON.stringify({ concepts: conceptsWithIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-concepts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
