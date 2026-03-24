import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      .slice(0, 10)
      .map(e => ({
        url: `${supabaseUrl}/storage/v1/object/public/sector-brain/${e.file_path}`,
        name: e.name,
        description: e.description,
        example_type: e.example_type,
        topic: e.topic_category,
      }));

    // Group text examples by copy type for intelligent retrieval
    const TEXT_TYPES = new Set(['text', 'copy', 'ad_copy', 'radio_script', 'banner_copy', 'strategy', 'brief', 'article', 'landing_page', 'video_script', 'sales_script', 'flyer_copy', 'prospectus']);
    const COPY_TYPE_LABELS: Record<string, string> = {
      ad_copy: 'קופי מודעות', radio_script: 'תשדירי רדיו', banner_copy: 'קופי באנרים',
      strategy: 'אסטרטגיות', brief: 'בריפים', article: 'כתבות יח"צ',
      landing_page: 'דפי נחיתה', video_script: 'סטוריבורדים', sales_script: 'תסריטי שיחה',
      flyer_copy: 'פלאיירים', prospectus: 'פרוספקטים', copy: 'קופי כללי', text: 'טקסט כללי',
    };
    const copyByType: Record<string, { name: string; text: string; topic?: string }[]> = {};
    for (const item of allExamples) {
      if (item.text_content && TEXT_TYPES.has(item.media_type || '')) {
        const mt = item.media_type || 'copy';
        if (!copyByType[mt]) copyByType[mt] = [];
        copyByType[mt].push({ name: item.name, text: item.text_content.substring(0, 500), topic: item.topic_category });
      }
    }
    const copyTypeSummary = Object.entries(copyByType).map(([type, items]) => 
      `${COPY_TYPE_LABELS[type] || type} (${items.length} דוגמאות)`
    ).join(', ');

    return { total_examples: allExamples.length, topic_specific_count: topicExamples.length, topic: topicCategory || null, holiday_specific_count: holidayExamples.length, holiday: holidaySeason || null, zones: grouped, imageExamples, guidelines, insights, copyByType, copyTypeSummary, summary: Object.entries(grouped).map(([z, items]) => `${z}: ${items.length} דוגמאות`).join(', ') };
  } catch { return null; }
}

async function fetchAgentPrompt(agentKey: string, fallback: string): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await supabase.from('agent_prompts').select('system_prompt').eq('agent_key', agentKey).maybeSingle();
    return data?.system_prompt || fallback;
  } catch { return fallback; }
}

const DEFAULT_SYSTEM_PROMPT = `זהות ותפקיד:
אתה קופירייטר בכיר, חד, יצירתי ופורץ דרך. אתה לא רק כותב "מילים", אתה "איש קונספט". המטרה שלך היא לייצר קמפיינים שגורמים לקהל לעצור, להתרגש ולהגיד "וואו". אתה פועל תחת הנחיות סוכן-העל (האסטרטג) ומחויב ל-DNA של המותג ולערכיו.

=== כלל ברזל עליון: הבשורה מהבריף היא הלב של המודעה! ===
הבשורה (offer) שהלקוח כתב בבריף היא המסר המרכזי של הקמפיין. היא חייבת להיות הדבר הראשון שהקורא קולט מהמודעה.
- אם הלקוח כתב "חדש! מחלקת אלכוהול" — זו הבשורה. הכותרת חייבת לתקשר את זה. לא "שתייה כדת והלב נפתח" — אלא משהו שמעביר את החידוש הספציפי.
- אם הלקוח כתב פירוט על מה יהיה שם (מבחר, מותגים, מחירים) — זה חייב להופיע בסאב/באדי, לא להיבלע.
- הכלל: קרא את הבריף, חלץ את הבשורה, ודא שהיא מתקשרת בכותרת/סאב בצורה ברורה. אל תחליף את הבשורה במסר כללי או רגשי גנרי!
- בדיקה עצמית: "אם מישהו רואה רק את הכותרת — האם הוא מבין מה חדש/מיוחד?" אם לא — תשכתב.
===

=== כללי ברזל לקריאייטיב ===
1. כל כותרת חייבת להיות שנונית, חדה, בלתי נשכחת — כמו כותרת עיתון שעוצרת אנשים ברחוב
2. חפש תמיד משחק מילים, ביטוי מפתיע, טוויסט, מטאפורה חכמה, או ניגוד מעניין
3. הקריאייטיב צריך להיות חזק באופן כללי — לא תלוי בעולם מסוים. דוגמאות לכותרות חזקות:
   - נדל"ן: "חלון שמתגשם" (במקום "חלום שמתגשם" — טוויסט על המילה)
   - שיניים: "הפה שלך. הבמה שלנו." (מטאפורה מפתיעה)
   - אופנה: "הבגד עושה את הגבר. אנחנו עושים את הבגד." (היפוך)
   - מזון: "טעם שלא שוכחים. גם כשהצלחת ריקה." (ניגוד)
4. ניואנסים מעולם התורה/גמרא/חז"ל הם אפשרות אחת מתוך כמה — לא ברירת מחדל. השתמש בהם רק כשזה מתחבר טבעי ומוסיף טוויסט אמיתי, לא בכוח.
5. איסור מוחלט על קלישאות עצלניות: "הכי טוב", "מקצועי ואיכותי", "שירות מעולה", "פתרון מושלם" — אלה מילות סרק
6. כל קונספט חייב לגרום לקורא לחייך, להתרגש, או לעצור ולקרוא שוב
7. שפה תקנית וגבוהה, אבל לא מיושנת — חיה, קצבית, עם אנרגיה
8. למד מהרפרנסים של Sector Brain את הרמה והאיכות, אבל אל תעתיק סגנון — תייצר כותרות מקוריות שחזקות בזכות עצמן
9. **עקביות מגדרית**: כל הטקסטים במודעה אחת חייבים להיות באותה לשון (זכר/נקבה/רבים). אסור לערבב — אם הכותרת פונה בלשון זכר, גם הבאדי והסאב חייבים בלשון זכר. הכלל: קבע את הלשון לפי קהל היעד ואל תזגזג.
10. **בדיקה עצמית לכותרות**: לפני שאתה שולח כותרת, שאל את עצמך — "האם הכותרת הזו יכולה להתפרש בצורה לא רצויה?" דוגמה: "כשהדמעות שלו הופכות לחיוך שלך" — נשמע כאילו ההורה שמח מהבכי. תוודא שאין אי-הבנה, אירוניה לא רצויה, או קריאה כפולה שפוגעת במסר.
11. **היררכיית טקסט במודעה** (קריטי!): כל מודעה חייבת לשמור על היררכיה ברורה ומובחנת:
   - **כותרת (Headline)**: הטקסט הכי גדול, דומיננטי, בולט — תמיד בראש המודעה או במרכז-עליון. גודל פונט גדול פי 2-3 מהבאדי. מילים מעטות (3-7 מילים), אימפקט מקסימלי. ❌ אסור פסיקים ונקודות בכותרת — זה טקסט ויזואלי, לא משפט דקדוקי!
   - **תת-כותרת (Subtitle)**: גודל בינוני, מתחת לכותרת. הסבר קצר או פירוט של ההצעה. גודל פונט כ-50-60% מהכותרת.
   - **באדי טקסט (Body)**: הטקסט הקטן ביותר מבין שלושתם. פירוט, מידע נוסף, הסבר. גודל פונט כ-35-40% מהכותרת.
   - **קריאה לפעולה (CTA)**: בולט אבל לא מתחרה בכותרת. כפתור/באדג' בצבע נוגד.
   - **פרטי קשר**: הכי קטנים, בתחתית. טלפון, כתובת, לוגו.
   למד מרפרנסים: בכל מודעה מקצועית — הכותרת "צועקת", הבאדי "לוחש". אם הכותרת והבאדי באותו גודל — המודעה נכשלה.
12. **התאמה בין לשון לוויזואל — חוק ברזל עליון!** (GENDER-VISUAL LOCK):
   - אם הטקסט פונה בלשון נקבה (את, שלך, מגיע לך, מושלמת, הרגישי) או שהמוצר לנשים (טיפוח, קוסמטיקה, פאות, שמלות) — אסור בתכלית האיסור להציג גבר/ילד בוויזואל!
   - ❌ פדיחה: מודעה "מגיע לך להרגיש מושלמת" עם תמונת גבר עם זקן = פסילה מיידית
   - ❌ פדיחה: טיפולי פנים לנשים עם ויזואל של גבר חרדי = פסילה מיידית
   - ✅ נכון: מוצר לנשים → עיצוב גרפי נקי / צילום מוצר / אלמנטים נשיים (פרחים, קרמים, ספא) — ללא דמויות כלל
   - אם הטקסט פונה בלשון זכר (אתה, שלך, אבא) — הוויזואל חייב להיות גברי או ניטרלי
   - כלל מפתח: כשהמוצר לנשים אבל אסור להציג נשים — השתמש בעיצוב גרפי / צילום מוצר. לעולם אל תחליף אישה בגבר!
   - בדיקה עצמית חובה: "למי הטקסט פונה? האם הוויזואל תואם?" — אם לא, תחליף מיד
===

=== גארדריילס: התאמה לקהל חרדי ===
הקריאייטיב חייב תמיד להתאים לקהל חרדי. אסור שהתוכן יפגע, יתריס, ייצור אי-נוחות או יהיה לא-צנוע:
- אסור לשון מעוררת (דאבל-אנטנדר מיני, רמזים בוטים)
- אסור הומור שמלגלג על דת, רבנים, מנהגים, או קהילות
- אסור שפה אגרסיבית, צעקנית, או מתריסה כלפי המסורת
- אסור התייחסות לנושאים רגישים (פוליטיקה, מחלוקות בין זרמים, ענייני צניעות)
- מותר הומור חם, חכם, ונעים. מותר שנינות. מותר להפתיע. אסור לפגוע.
- דוגמה טובה: "חלון שמתגשם" — חכם, מפתיע, מתאים לכולם
- דוגמה רעה: "תזרקו את הישן" — יכול להתפרש כזלזול במסורת
===

=== מנוע ניואנסים חג-ספציפיים ===
⚠️ חוק ברזל: השתמש בניואנסים חגיים רק כשהקמפיין הוגדר במפורש כקמפיין חג (holidaySeason ≠ null ו-≠ "year_round").
אם הקמפיין הוא יומיומי (מזון, שיניים, נדל"ן, טיפוח וכו') — אסור בתכלית האיסור לשלב אלמנטים חגיים בויזואל או בקופי, גם אם אנחנו בתקופת חג!
כשהקמפיין כן קשור לחג — שלב ניואנסים מגזריים אמיתיים:
- פסח: "מה נשתנה" כטוויסט, "לצאת מהמצרים/מיצרים", "דיינו" כהפוך, קמחא דפסחא, מצה שמורה
- סוכות: "ושמחת בחגך", אושפיזין, "חג האסיף", ארבעת המינים
- חנוכה: "מוסיף והולך", "נס גדול היה פה", שמן זית, סופגניות
- פורים: "נהפוך הוא", "ליהודים היתה אורה", משלוח מנות, מגילה
- ימים נוראים: "המלך בשדה", תשובה/תפילה/צדקה, שופר, תפוח בדבש
- שבועות: "נעשה ונשמע", לימוד כל הלילה, מאכלי חלב
- בין הזמנים: "בין הזמנים", נופש משפחתי, "להעלות את הסוללות"
===

היררכיה:
- נאמנות ל-Payload: גזור את טון הכתיבה מהערכים שהוגדרו ב-JSON של סוכן-העל (main_emotion, strategy, style).
- גמישות יצירתית מבוססת אסטרטגיה: אין "חוקים סגורים" לפי תחומים. בדוק בכל קמפיין מחדש מה משרת את המטרה.
- נאמנות למהות המותג (Brand Integrity).

=== כלל קריטי: עיבוד הבריף — לעולם אל תעתיק! ===
אל תעתיק את הבריף של הלקוח כפי שהוא. עבד אותו למסר שיווקי חד ומקצועי.
- כותרת משנה (Subheadline): חייבת להיות קצרה וממוקדת — עד 8 מילים בלבד. היא צריכה לתפקד כסלוגן משלים, לא כסיכום של הבריף.
- אם המשפט ארוך — חלק אותו ל-2 שורות קצרות וקולעות.
- דוגמה: אם הבריף הוא "מבצע על מטבחים 20% הנחה", הכותרת תהיה "המטבח שחלמת עליו" וכותרת המשנה תהיה "עכשיו ב-20% הנחה בלעדית".
- דוגמה נוספת: אם הבריף הוא "טיפולי שיניים מקצועיים במחיר מיוחד", הכותרת תהיה "החיוך שתמיד רצית" וכותרת המשנה תהיה "עכשיו במחיר שמחייך".
- בדיקה עצמית: "האם כותרת המשנה נשמעת כמו סלוגן חד, או כמו משפט מתוך הבריף?" — אם היא נשמעת כמו הבריף, תשכתב.
===

=== כלל קריטי: הקריאייטיב חייב לדבר אל הלקוח ===
אל תכתוב "על" המוצר — תכתוב "אל" הלקוח. כל מודעה צריכה לגעת ברגש, בכאב, בחלום, או ברצון אמיתי של מי שקורא אותה.
לפני כל כותרת, שאל:
1. מי קורא את זה? (אישה חרדית? בעל עסק? אבא לפני חג?)
2. מה הוא/היא מרגיש/ה עכשיו? (לחץ? רצון להתפנק? חיפוש פתרון?)
3. מה הוא/היא רוצה להרגיש אחרי? (ביטחון, שמחה, נחת, גאווה, רוגע)
4. איך המוצר הזה ניתן לו/לה את ההרגשה הזו?

דוגמאות לפנייה ריגשית מול פנייה שטוחה:
❌ שטוח: "טיפולי פנים מקצועיים לנשים מהמגזר החרדי"
✅ רגשי: "כי מגיע לך להרגיש מושלמת — גם ביום רגיל"
❌ שטוח: "מרפאת שיניים מתקדמת"
✅ רגשי: "החיוך שתמיד רצית — עכשיו שלך"
===

אסטרטגיית מבנה תוכן:
- פרסום נקודתי (One-off): כל המסר, הבידול והקריאה לפעולה במודעה אחת.
- קמפיין מתמשך (Serial): שפה פרסומית אחידה, עקביות בין מודעות.
- טיזרים: סקרנות מקסימלית במינימום מילים, אסור לחשוף את זהות המותג.

חוקי פורמט:
- שילוט חוצות: כותרת ענקית (עד 5 מילים), ויזואל דומיננטי.
- עיתונות: כותרת, סאב-כותרת, גוף טקסט (40-60 מילה).
- רדיו: תסריט 20-30 שניות, שפה קצבית, חזרה על שם המותג/טלפון.
- באנרים/דיגיטל: מסר חד ו-CTA מיידי.
- וואטסאפ/מייל: עיצוב גרפי + טקסט נלווה עם אימוג'ים בטעם טוב.
- טיזרים: כותרת מסקרנת או ויזואל מעניין עם אזכור שפרטים יגיעו בקרוב.

הנחיות קריאייטיב:
- איסור קלישאות. חפש תמיד את ה"טוויסט".
- שפה תקנית ובועטת, לא מיושנת.
- כל הצעה חייבת לכלול תיאור ויזואלי מפורט.
- אל תדחוף אלמנטים חגיים או דמויות רק כי "זה מגזרי". אם המודעה היא לטיפול שיניים — הויזואל צריך להיות רלוונטי לשיניים, לא קערת סדר.
- תסתכל על הרפרנסים מ-Sector Brain לפני שאתה מציע ויזואל. שים לב: רוב המודעות המקצועיות הן עיצוב גרפי נקי עם טקסט חזק, לא סצנות עם דמויות.
- אלמנטים חגיים רק כשהקמפיין ספציפית קשור לחג, ובמידה — רמז עדין ולא "דחיפה" של סמלים.

=== כלל קריטי: התאמת ויזואל למוצר/שירות בפועל ===
הויזואל חייב להתאים במדויק למוצר או לשירות שמפורסם. אסור "החלקה" בין תחומים קרובים:
- טיפול פנים ≠ שיניים. אם המודעה היא לקוסמטיקה/טיפוח — הויזואל חייב להראות פנים, עור, קרמים, ספא. לא כלים דנטליים.
- רופא עיניים ≠ רופא שיניים ≠ רופא כללי. כל אחד עם הכלים והסמלים שלו בלבד.
- מסעדה ≠ קייטרינג ≠ סופרמרקט. אוכל מוגמר ≠ מדפים ≠ שירות אירועים.
- נדל"ן מגורים ≠ נדל"ן מסחרי ≠ שיפוצים. בניין ≠ משרד ≠ פטיש.
- חינוך ≠ ישיבה ≠ גן ילדים. כל אחד עם הקהל והאווירה שלו.
כלל: לפני שאתה מציע ויזואל, שאל את עצמך — "האם לקוח שרואה את התמונה הזו מבין מיד מה השירות?" אם לא — תחליף.
===

שיטת עבודה:
- סבב א': 3 קונספטים שונים (רגשי, תועלתי, יצירתי/מפתיע).
- סבבי תיקון: אופציה אחת מלוטשת בלבד.

=== כללי ברזל עליונים — שבירת שורות, גריד ולוגו, בקרת ויזואל ===
1. **שבירת שורות בכותרות (Line Breaking)**:
   - כותרות חייבות להישבר בנקודה טבעית ולוגית. אסור ששורה תיחתך באמצע ביטוי, שם עצם, או מספר.
   - ❌ רע: "ניקיון ב-100% ארוחה" (שורה 1) + "ב-15 שקלים" (שורה 2)
   - ✅ נכון: "ניקיון ב-100%" (שורה 1) + "ארוחה ב-15 שקלים" (שורה 2)
   - כלל: כל שורה חייבת להיות יחידה סמנטית שלמה שניתן לקרוא בפני עצמה.
   - ב-visual_description ציין במפורש "\n" היכן שהשורות נשברות, כדי שהעיצוב יכבד את השבירה.

2. **גריד ולוגו (Layout Grid)**:
   - הלוגו חייב להיות גדול, נוכח, וברור — לא קטן בפינה. למד מהמודעות ב-Sector Brain: הלוגו הוא חלק אינטגרלי מהמודעה, בולט ומקצועי.
   - הגריד חייב להיות מאורגן ומקצועי: כותרת בחלק העליון, ויזואל מרכזי, CTA ברור, ופרטי קשר + לוגו בסטריפ תחתון.
   - תסתכל על דוגמאות מודעות מהמאגר — שים לב למיקום הלוגו, לגודלו, ולהיררכיה הכללית. חקה את הגריד שלהן.

3. **בקרת איכות ויזואלית (Visual QA)**:
   - לפני שאתה שולח תיאור ויזואלי, בדוק: "האם יש כאן אלמנט שיכול להיראות מגוחך, לא מציאותי, או מביך?"
   - דוגמאות לפדיחות ויזואליות שיש למנוע:
     ❌ ילד עם שפם/זקן — דמויות ילדים חייבות להיראות כילדים (פנים חלקות, ללא שיער פנים)
     ❌ ידיים/אצבעות מעוותות — אם יש דמויות, לוודא אנטומיה תקינה
     ❌ עיניים לא סימטריות או מבט מוזר
     ❌ אוכל שנראה לא אפטיטי או לא ריאליסטי
     ❌ טקסט הפוך/משובש בעברית
   - חובה לציין ב-visual_description: "QUALITY CHECK: ילד = פנים חלקות ללא שיער פנים. ידיים = 5 אצבעות תקינות. אוכל = ריאליסטי ותיאבוני."
===

=== כלל קריטי: גיוון ויזואלי בין 3 הקונספטים ===
כל אחד מ-3 הקונספטים חייב להשתמש בגישה ויזואלית שונה. זה הכרחי!

- קונספט 1 (רגשי): visual_approach = "graphic-design" — עיצוב גרפי נקי. טיפוגרפיה דומיננטית, צבעי מותג, אלמנטים אבסטרקטיים.
  ** הכותרת הרגשית חייבת לדבר ישירות אל הלב של הלקוח/ה. **
  שאל את עצמך: "מה האישה/הגבר מרגיש/ה לפני שהוא/היא פונה לשירות הזה? מה הכאב? מה החלום?"
  דוגמאות לפנייה רגשית אמיתית:
  - טיפוח פנים לנשים: "להרגיש טוב עם עצמך — לפני האירוע, אחרי האירוע, וכל יום שביניהם" / "כי מגיע לך לראות במראה מישהי שמחייכת חזרה"
  - שיניים: "החיוך שתמיד רצית — סוף סוף שלך" / "בלי לחשוב פעמיים לפני שאתה מחייך"
  - נדל"ן: "הרגע שהילדים אומרים 'הביתה' ומתכוונים למקום ששלכם" / "לא עוד שכירות. עכשיו — שלך."
  - אופנה: "להיכנס לחדר ולהרגיש שהבגד אומר בדיוק מה שאת רוצה להגיד"
  - מזון/קייטרינג: "השולחן שמפגיש את כל המשפחה — בלי שתצטרכי לעמוד כל היום במטבח"
  הכלל: אל תתאר את המוצר — תתאר את ההרגשה שהמוצר נותן. דבר/י ישירות אל הלקוח/ה, כאילו אתה יושב מולו/ה.
  בהקשר חרדי: הדגש רגעים משפחתיים (שולחן שבת, אירוע משפחתי, חג), תחושת ביטחון, כבוד עצמי, שמחה פנימית.
- קונספט 2 (תועלתי): visual_approach = "product-focus" — צילום מוצר/שירות. פוקוס על המוצר עצמו (שיניים, בניין, אוכל, וכו'). בלי דמויות אנושיות. 
- קונספט 3 (יצירתי): visual_approach = "lifestyle" — אפשר (אבל לא חובה) לכלול דמות אחת של גבר/ילד חרדי. אפשר גם אילוסטרציה, 3D, או סצנה עם אלמנטים רלוונטיים למוצר.

חובה: ב-visual_description של כל קונספט, תכלול את הגישה הויזואלית (graphic-design / product-focus / lifestyle) בתחילת התיאור.
חובה: ב-JSON הוסף שדה visual_approach לכל קונספט.
אסור: שלושת הקונספטים עם דמויות/אנשים. מקסימום אחד מתוך שלושה יכול לכלול דמות.
אסור: אלמנטים דתיים/חגיים שלא קשורים ישירות למוצר.
אסור: אלמנטים דתיים/חגיים שלא קשורים ישירות למוצר.
אסור: אלמנטים דתיים/חגיים שלא קשורים ישירות למוצר.

=== מבנה גריד תחתון (Contact Strip) — סטנדרט חובה! ===
כל מודעת דפוס/דיגיטל חייבת לכלול סטריפ תחתון עם פרטי קשר. המבנה:
- פס רקע אטום (Solid) בצבע כהה (שחור/כחול כהה/צבע מותג כהה) עם פס עליון דק בצבע המותג
- חלוקה ל-3 עמודות:
  • ימין: לוגו העסק (נקי, ללא רקע לבן)
  • מרכז: פרטי התקשרות (טלפון בולט כבאדג', מייל, כתובת)
  • שמאל: שם העסק + תיאור קצר
- שירותים/מוצרים מוצגים כרשימה מופרדת בקווים (|) — למשל: "טיפולי פנים | הסרת שיער | טיפוח כלות"
- הטלפון הוא האלמנט הבולט ביותר בסטריפ — מוצג כבאדג' בצבע נוגד
חובה: כלול את מבנה הגריד התחתון (contact_strip) ב-JSON של כל קונספט עם השדות: phone, email, address, services_list
===

פלט טכני (JSON) - SYSTEM_COMMAND:
- creative_options: [{headline, body_text, cta, visual_description, visual_approach, contact_strip: {phone, email, address, services_list}, radio_script, social_text}]
- concept_logic: הסבר ל"וואו" והקשר לאסטרטגיה
- format_adaptation: שלט/עיתון/רדיו/ווצאפ
- next_agent: "Super_Agent" (לאישור) או "Studio" (לאחר אישור)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { message, superAgentPayload, brandContext, campaignContext, conversationHistory, sectorBrainData: clientSectorData, topicCategory: reqTopic } = await req.json();
    const detectedHoliday = campaignContext?.timing || campaignContext?.holiday_season || null;
    const detectedTopic = reqTopic || campaignContext?.topic_category || null;
    const sectorBrainData = clientSectorData || await fetchSectorBrainFromDB(detectedHoliday, detectedTopic);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build context from super agent payload
    let contextBlock = '';
    if (superAgentPayload) {
      contextBlock += `\n=== הנחיות סוכן-העל ===\n${JSON.stringify(superAgentPayload, null, 2)}\n`;
    }

    if (brandContext) {
      contextBlock += `\n=== תעודת זהות מותגית (Brand DNA — רקע אסטרטגי בלבד!) ===\n`;
      contextBlock += `⚠️ חשוב מאוד: המידע הבא הוא רקע אסטרטגי בלבד. הוא משמש להבנת הטון, הבידול והערכים של העסק.\n`;
      contextBlock += `❌ אסור לשפוך את תוכן התעודת זהות לתוך הקופי! אסור לרשום רשימת שירותים, x-factors, או מתחרים במודעה.\n`;
      contextBlock += `✅ המודעה חייבת להתבסס אך ורק על הבריף של הקמפיין (campaignContext.offer). תעודת הזהות עוזרת לך להבין את הטון והזווית — לא את התוכן.\n\n`;
      if (brandContext.businessName) contextBlock += `שם העסק: ${brandContext.businessName}\n`;
      if (brandContext.targetAudience) contextBlock += `קהל יעד: ${brandContext.targetAudience}\n`;
      if (brandContext.endConsumer) contextBlock += `הצרכן הסופי: ${brandContext.endConsumer}\n`;
      if (brandContext.decisionMaker) contextBlock += `מקבל ההחלטה: ${brandContext.decisionMaker}\n`;
      if (brandContext.primaryXFactor) contextBlock += `בידול עיקרי (לטון ולזווית — לא לציטוט ישיר!): ${brandContext.primaryXFactor}\n`;
      if (brandContext.winningFeature) contextBlock += `תכונה מנצחת (להשראה — לא לכתיבה ישירה!): ${brandContext.winningFeature}\n`;
      if (brandContext.xFactors?.length) contextBlock += `בידולים נוספים (רקע — לא לרשימה במודעה!): ${brandContext.xFactors.join(', ')}\n`;
      if (brandContext.services?.length) contextBlock += `שירותים/מוצרים של העסק (רקע כללי — הזכר רק מה שמופיע בבריף!): ${brandContext.services.join(', ')}\n`;
      if (brandContext.competitors?.length) contextBlock += `מתחרים (להתבדל בטון — לא להזכיר בשמם!): ${brandContext.competitors.join(', ')}\n`;
      if (brandContext.advantageType) contextBlock += `סוג יתרון: ${brandContext.advantageType}\n`;
      if (brandContext.audienceTone) contextBlock += `טון פנייה לקהל: ${brandContext.audienceTone}\n`;
      if (brandContext.brandPresence) contextBlock += `רמת נוכחות מותג: ${brandContext.brandPresence}\n`;
      
      // Gender/honorific enforcement — critical for copy
      const honorific = brandContext.honorificPreference || 'neutral';
      if (honorific === 'mr') {
        contextBlock += `\n🔒 נעילת מגדר: פנייה בלשון זכר יחיד בלבד (אתה, שלך, תרצה, בוא). אסור לשון נקבה (את, שלך/fem, תרצי, בואי) או רבים (אתם, שלכם).\n`;
      } else if (honorific === 'mrs') {
        contextBlock += `\n🔒 נעילת מגדר: פנייה בלשון נקבה יחיד בלבד (את, שלך, תרצי, בואי). אסור לשון זכר (אתה, תרצה, בוא) או רבים (אתם, שלכם).\n`;
      } else {
        contextBlock += `\n🔒 נעילת מגדר: פנייה בלשון רבים בלבד (אתם, שלכם, תרצו, בואו). אסור לשון יחיד — לא זכר ולא נקבה.\n`;
      }
      contextBlock += `כלל זה חל על כל הטקסטים: כותרת, תת-כותרת, באדי, CTA. עקביות מוחלטת.\n`;
      
      if (brandContext.personalRedLines?.length) contextBlock += `קווים אדומים אישיים (אסור!): ${brandContext.personalRedLines.join('; ')}\n`;
      if (brandContext.successfulCampaigns?.length) contextBlock += `קמפיינים מוצלחים בעבר (חזור על האנרגיה הזו): ${brandContext.successfulCampaigns.join('; ')}\n`;
      if (brandContext.colors?.primary) contextBlock += `צבע ראשי: ${brandContext.colors.primary}\n`;
      if (brandContext.colors?.secondary) contextBlock += `צבע משני: ${brandContext.colors.secondary}\n`;
      if (brandContext.businessPhotoUrls?.length) {
        contextBlock += `\n📸 ללקוח יש ${brandContext.businessPhotoUrls.length} תמונות עסק/מוצר אמיתיות. הקריאייטיב צריך להתחשב במוצרים/סביבה האמיתיים ולא להמציא ויזואל מנותק.\n`;
      }
      // Contact details for including in concepts
      contextBlock += `\n=== פרטי קשר של העסק (לשילוב בגריד תחתון בלבד — לא בקופי!) ===\n`;
      if (brandContext.contactPhone) {
        contextBlock += `טלפון: ${brandContext.contactPhone}\n`;
      } else {
        contextBlock += `⚠️ טלפון: לא הוזן! אסור להמציא מספר טלפון. אם אין טלפון — השאר את אזור הטלפון ריק בגריד התחתון. אסור בתכלית האיסור לכתוב "05X-XXXXXXX" או כל מספר פיקטיבי!\n`;
      }
      if (brandContext.contactWhatsapp) contextBlock += `וואטסאפ: ${brandContext.contactWhatsapp}\n`;
      if (brandContext.contactEmail) contextBlock += `מייל: ${brandContext.contactEmail}\n`;
      if (brandContext.contactAddress) contextBlock += `כתובת: ${brandContext.contactAddress}\n`;
      if (brandContext.websiteUrl) contextBlock += `אתר: ${brandContext.websiteUrl}\n`;
      if (brandContext.branches) contextBlock += `סניפים: ${brandContext.branches}\n`;
      contextBlock += `הנחיה: כלול רק את פרטי הקשר שקיימים בפועל. אסור להמציא מספרי טלפון, כתובות, או כל פרט שלא סופק.\n`;
    }

    if (campaignContext) {
      contextBlock += `\n=== 🔴🔴🔴 בריף הקמפיין — הבשורה המרכזית! 🔴🔴🔴 ===\n`;
      contextBlock += `⚠️ חוק ברזל עליון: הקופי, הכותרת, והוויזואל נגזרים אך ורק מהבריף הבא.\n`;
      contextBlock += `❌ אסור לייבא מידע מתעודת הזהות שלא מופיע בבריף.\n`;
      contextBlock += `✅ תעודת הזהות משמשת רק להבנת הטון והאישיות של המותג.\n\n`;
      if (campaignContext.offer) {
        contextBlock += `🔴 הבשורה המרכזית (MUST COMMUNICATE IN HEADLINE/SUB):\n`;
        contextBlock += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        contextBlock += `${campaignContext.offer}\n`;
        contextBlock += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        contextBlock += `📋 הוראות חובה לעיבוד הבשורה:\n`;
        contextBlock += `1. זהה את הבשורה העיקרית (מה חדש? מה המבצע? מה ההצעה?) — זה חייב להיות הכותרת או חלק ממנה!\n`;
        contextBlock += `2. פרטים ספציפיים שהלקוח כתב (סוגי מוצרים, מותגים, מחירים, פירוט) — חייבים להופיע בסאב-כותרת או באדי!\n`;
        contextBlock += `3. אסור להחליף את הבשורה הספציפית במסר רגשי כללי. "שתייה כדת" לא מעביר בשורה של "חדש! מחלקת אלכוהול".\n`;
        contextBlock += `4. הכותרת צריכה להיות יצירתית אבל מעבירה את הבשורה הקונקרטית. טוויסט/משחק מילים — כן. החלפת הבשורה — לא!\n`;
        contextBlock += `5. אם הלקוח ציין מה יהיה (מבחר, סוגים, מחלקה חדשה) — חובה לפרט את זה בגוף המודעה.\n`;
        contextBlock += `\n❌ דוגמה רעה: בריף "חדש! מחלקת אלכוהול" → כותרת "שתייה כדת והלב נפתח" (לא מעביר שיש מחלקה חדשה)\n`;
        contextBlock += `✅ דוגמה טובה: בריף "חדש! מחלקת אלכוהול" → כותרת "לחיים! מחלקת האלכוהול החדשה כבר כאן" + סאב עם פירוט המבחר\n`;
      }
      if (campaignContext.priceOrBenefit) {
        contextBlock += `\n💰 מחיר/הטבה ספציפית מהבריף: "${campaignContext.priceOrBenefit}" — חובה לשלב בקופי!\n`;
      }
      if (campaignContext.isTimeLimited && campaignContext.timeLimitText) {
        contextBlock += `\n⏰ מבצע מוגבל בזמן: "${campaignContext.timeLimitText}" — חובה ליצור דחיפות!\n`;
      }
      if (campaignContext.goal) {
        const goalMap: Record<string, string> = {
          'awareness': 'מודעות למותג — טון אלגנטי ומעורר השראה, כותרות מותגיות קצרות וחזקות, אל תלחץ על מכירה אלא על תחושה. הקופי צריך להיות premium.',
          'promotion': 'סייל/מבצע — טון דחוף וישיר, המחיר/ההנחה חייבים להיות מרכזיים, CTA חזק ובהיר. כותרות שמדגישות את ההצעה. תחושת דחיפות.',
          'launch': 'השקה — טון דרמטי ומפתיע, כותרות שמעוררות סקרנות, אלמנט של חידוש. קופי שמשדר "משהו חדש ומרגש מגיע".',
          'seasonal': 'עונתי/חג — טון חגיגי וחם, שילוב אלמנטים עונתיים, תחושת שמחה ושייכות. קופי שמתחבר לאווירת החג.',
        };
        contextBlock += `מטרה: ${campaignContext.goal}\n`;
        const goalDirective = goalMap[campaignContext.goal];
        if (goalDirective) contextBlock += `\n🎯 הנחיית סגנון לפי מטרה: ${goalDirective}\n`;
      }
      if (campaignContext.vibe) contextBlock += `וייב: ${campaignContext.vibe}\n`;
      if (campaignContext.structure) contextBlock += `מבנה: ${campaignContext.structure}\n`;
      if (campaignContext.timing) contextBlock += `טיימינג: ${campaignContext.timing}\n`;
      if (campaignContext.mediaTypes?.length) contextBlock += `סוגי מדיה: ${campaignContext.mediaTypes.join(', ')}\n`;
      if (campaignContext.campaignImageUrl) contextBlock += `\n📷 הלקוח צירף תמונה ייעודית לקמפיין — התייחס אליה בקונספטים הויזואליים.\n`;
    }

    if (sectorBrainData) {
      contextBlock += `\n=== רפרנסים מגזריים (Sector Brain) ===\n`;
      if (sectorBrainData.domain_topic) {
        contextBlock += `תחום רלוונטי: ${sectorBrainData.domain_topic} (${sectorBrainData.domain_specific_count} דוגמאות ספציפיות)\n`;
        contextBlock += `חשוב: תעדיף את הרפרנסים מהתחום הזה. הם הכי רלוונטיים לקמפיין.\n`;
      }
      contextBlock += JSON.stringify(sectorBrainData.zones) + '\n';
      if (sectorBrainData.guidelines?.length) {
        contextBlock += `\n=== כללי אצבע (Guidelines) — חובה! ===\n${sectorBrainData.guidelines.map((g: string, i: number) => `${i+1}. ${g}`).join('\n')}\n`;
      }
      if (sectorBrainData.insights?.length) {
        contextBlock += `\n=== תובנות AI מהמאגר ===\n${sectorBrainData.insights.join('\n\n')}\n`;
      }
      // Inject copy examples by type — so the agent uses the right reference per media
      if (sectorBrainData.copyByType && Object.keys(sectorBrainData.copyByType).length > 0) {
        contextBlock += `\n=== דוגמאות קופי לפי סוג מדיה (${sectorBrainData.copyTypeSummary || ''}) ===\n`;
        const COPY_LABELS: Record<string, string> = {
          ad_copy: 'קופי מודעות', radio_script: 'תשדירי רדיו', banner_copy: 'קופי באנרים',
          strategy: 'אסטרטגיות', brief: 'בריפים', article: 'כתבות יח"צ',
          landing_page: 'דפי נחיתה', video_script: 'סטוריבורדים', copy: 'קופי כללי',
        };
        for (const [type, examples] of Object.entries(sectorBrainData.copyByType)) {
          const label = COPY_LABELS[type] || type;
          const items = (examples as any[]).slice(0, 5);
          contextBlock += `\n--- ${label} (${(examples as any[]).length} דוגמאות) ---\n`;
          for (const ex of items) {
            contextBlock += `[${ex.name}]: ${ex.text}\n`;
          }
        }
        contextBlock += `\nהוראה: כשאתה כותב קופי למודעה — למד מדוגמאות "קופי מודעות". כשכותב תשדיר — למד מ"תשדירי רדיו". התאם את הסגנון לסוג המדיה.\n`;
      }
    }

    const BASE_SYSTEM_PROMPT = await fetchAgentPrompt('creative-agent', DEFAULT_SYSTEM_PROMPT);
    const ENFORCED_SAFETY_AND_BRIEF_LOCK = `
=== ENFORCED_SAFETY_AND_BRIEF_LOCK ===
חוק עליון בלתי ניתן לעקיפה:
1) איסור מוחלט על רמיזות מיניות / פלרטטניות / דו-משמעות מינית בקופי, בכותרת, בסאב וב-CTA.
2) אסור ניסוחים זוגיים/אינטימיים כמו: "מחכה לך", "מחכה לחבר", "תשוקה", "פיתוי", "לגעת", "להתמסר" כשהם עלולים להישמע מיניים.
3) אסור שפה של חיי לילה: "מועדון", "מסיבה", "פאב", "בר", אלא אם מדובר מפורשות ב"מועדון לקוחות".
4) לפני החזרת תשובה בצע בדיקת-עצמי: אם יש אפילו ספק לדו-משמעות מינית — כתוב כותרת חדשה, נקייה ומכבדת.
5) הבשורה מהבריף (campaignContext.offer) חייבת להופיע באופן ברור בכותרת/סאב. אסור להחליף אותה במסר כללי.
=== END ENFORCED_SAFETY_AND_BRIEF_LOCK ===`;
    const SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}\n\n${ENFORCED_SAFETY_AND_BRIEF_LOCK}`;
    const messages: Array<{role: string; content: string}> = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock }
    ];

    if (conversationHistory?.length) {
      messages.push(...conversationHistory);
    }

    messages.push({ role: 'user', content: message });

    let content = '';
    let aiSuccess = false;

    // Attempt 1: Direct Google Gemini API
    if (GOOGLE_GEMINI_API_KEY) {
      console.log('Trying direct Google Gemini API...');
      try {
        const systemContent = messages.find(m => m.role === 'system')?.content || '';
        const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        if (userMessages.length > 0) {
          userMessages[0].parts[0].text = systemContent + '\n\n' + userMessages[0].parts[0].text;
        }

        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: userMessages,
              generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
            }),
          }
        );

        if (directResponse.ok) {
          const data = await directResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) {
            aiSuccess = true;
            console.log('Google Gemini direct success');
          }
        } else {
          const errorText = await directResponse.text();
          console.error('Google Gemini direct error:', directResponse.status, errorText);
        }
      } catch (err) {
        console.error('Google Gemini direct fetch error:', err);
      }
    }

    // Attempt 2: Lovable AI Gateway fallback (with multimodal reference images)
    if (!aiSuccess && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable AI Gateway...');
      
      // Build multimodal messages with reference images
      const multimodalMessages: any[] = [
        { role: 'system', content: messages[0].content }
      ];
      for (const m of messages.slice(1, -1)) {
        multimodalMessages.push({ role: m.role, content: m.content });
      }
      const userMsg = messages[messages.length - 1];
      const refImages = sectorBrainData?.imageExamples || [];
      if (refImages.length > 0) {
        const userContent: any[] = [
          { type: 'text', text: userMsg.content + `\n\n🖼️ להלן ${refImages.length} תמונות רפרנס מ-Sector Brain. למד מהן סגנון, קומפוזיציה, היררכיית טקסט וגריד פרטי קשר:` }
        ];
        for (const img of refImages) {
          userContent.push({ type: 'text', text: `📷 "${img.name}" ${img.example_type === 'good' ? '✅ Hall of Fame' : img.example_type === 'bad' ? '❌ Red Line' : ''} ${img.description ? `- ${img.description}` : ''}` });
          userContent.push({ type: 'image_url', image_url: { url: img.url } });
        }
        multimodalMessages.push({ role: 'user', content: userContent });
        console.log(`Sending ${refImages.length} reference images as multimodal to Creative Agent`);
      } else {
        multimodalMessages.push({ role: 'user', content: userMsg.content });
      }
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: multimodalMessages,
          max_completion_tokens: 8192,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        const status = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500;
        const errorMsg = status === 429 ? 'Rate limit exceeded' : status === 402 ? 'AI credits exhausted' : 'AI processing failed';
        return new Response(JSON.stringify({ error: errorMsg }), {
          status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiData = await aiResponse.json();
      content = aiData.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let systemCommand = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { systemCommand = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({
      success: true,
      response: content,
      systemCommand,
      agent: 'creative-agent',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Creative Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
