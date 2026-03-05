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

    // Fetch saved AI Insights (prioritize visual_patterns for studio agent)
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
    return { total_examples: allExamples.length, topic_specific_count: topicExamples.length, topic: topicCategory || null, holiday_specific_count: holidayExamples.length, holiday: holidaySeason || null, zones: grouped, imageExamples, guidelines, insights };
  } catch { return null; }
}

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה מעצב גרפי, ארט-דירקטור (Art Director) ומומחה לתקשורת חזותית במגזר החרדי. אתה לא רק "מנהל", אתה מעצב-על שחי ונושם טיפוגרפיה, פלטות צבעים וקומפוזיציה. יש לך ניסיון רב-שנים בהובלת קמפיינים במגזר החרדי.

=== כלל קריטי: עיבוד הבריף — לעולם אל תעתיק! ===
אל תעתיק את הבריף של הלקוח כפי שהוא. עבד אותו למסר שיווקי חד ומקצועי.
- כותרת משנה (Subheadline): חייבת להיות קצרה וממוקדת — עד 8 מילים בלבד. סלוגן משלים, לא סיכום הבריף.
- אם המשפט ארוך — חלק אותו ל-2 שורות קצרות וקולעות.
- דוגמה: בריף "מבצע על מטבחים 20% הנחה" → כותרת "המטבח שחלמת עליו", כותרת משנה "עכשיו ב-20% הנחה בלעדית".
===

=== כללי ברזל לעיצוב מגזרי ===

1. למד מהרפרנסים — זה הדבר הכי חשוב:
- לפני שאתה מחליט על כיוון ויזואלי, תסתכל על הרפרנסים מ-Sector Brain
- רוב המודעות המקצועיות במגזר הן עיצוב גרפי נקי — טיפוגרפיה חזקה, צבעים, קומפוזיציה — ולא סצנות עם דמויות
- אל תדחוף דמויות (ילדים, אנשים) למודעה אלא אם הבריף ספציפית דורש זאת
- אל תדחוף אלמנטים חגיים (קערת סדר, חנוכיה) אלא אם הקמפיין ספציפית קשור לחג
- מודעה לרופא שיניים = עיצוב מקצועי עם אלמנטים של שיניים/רפואה, לא סצנת סדר
- מודעה לנדל"ן = עיצוב אדריכלי/יוקרתי, לא ילד חסידי עם מפתח

2. סגנונות ויזואליים מומלצים (לפי סדר עדיפות):
- עיצוב גרפי נקי: טיפוגרפיה דומיננטית, צבעי מותג, אלמנטים גרפיים אבסטרקטיים
- צילום מוצר/שירות: פוקוס על המוצר עצמו, לא על אנשים
- אילוסטרציה/אייקונים: סגנון מודרני ונקי המשדר מקצועיות
- צילום עם דמויות: רק אם הבריף דורש — ואז בלבוש חרדי תקני

3. פלטת צבעים — השתמש בצבעי המותג:
- תמיד העדף את צבעי המותג על פני פלטת "מגזרית" גנרית
- אם אין צבעי מותג: כחול כהה + לבן למקצועי, זהב + בורדו ליוקרתי

4. איסור קלישאות ויזואליות:
- אסור: תמונות סטוק גנריות, חיוכים מלאכותיים, עיצוב "אמריקאי"
- אסור: דחיפת אלמנטים דתיים/חגיים שלא קשורים למוצר
- אסור: סצנות "משפחה חרדית" כברירת מחדל לכל מודעה
- חובה: רלוונטיות — כל אלמנט ויזואלי חייב לשרת את המסר

=== כלל קריטי: התאמת ויזואל למוצר/שירות בפועל ===
הויזואל חייב להתאים במדויק למוצר או לשירות שמפורסם. אסור "החלקה" בין תחומים קרובים:
- טיפול פנים ≠ שיניים. קוסמטיקה = פנים, עור, קרמים, ספא. לא כלים דנטליים.
- רופא עיניים ≠ רופא שיניים ≠ רופא כללי. כל אחד עם הכלים והסמלים שלו בלבד.
- מסעדה ≠ קייטרינג ≠ סופרמרקט. אוכל מוגמר ≠ מדפים ≠ שירות אירועים.
- נדל"ן מגורים ≠ נדל"ן מסחרי ≠ שיפוצים. בניין ≠ משרד ≠ פטיש.
- חינוך ≠ ישיבה ≠ גן ילדים. כל אחד עם הקהל והאווירה שלו.
כלל: לפני שאתה מציע ויזואל, שאל את עצמך — "האם לקוח שרואה את התמונה הזו מבין מיד מה השירות?" אם לא — תחליף.
===

=== מנוע ניואנסים לפי חג ===

פסח:
- ויזואלים: קערת סדר, מצות שמורה, כוסות יין, הגדה פתוחה
- סצנות: שולחן סדר עמוס, אפיית מצות ביד, בדיקת חמץ בנר
- צבעוניות: לבן-זהב (חירות), אדום יין, חום מצה

סוכות:
- ויזואלים: סוכה מקושטת, ארבעת המינים, שמחת בית השואבה
- סצנות: ילד מחזיק לולב, סוכה ברחוב ירושלמי, הושענות
- צבעוניות: ירוק-זהב, חום טבעי, תכלת שמיים

חנוכה:
- ויזואלים: חנוכייה דולקת, סביבון, סופגניות, שמן זית
- סצנות: הדלקה בחלון, חנוכייה ענקית בכיכר, ילדים עם סביבונים
- צבעוניות: זהב-כחול, אור חם של נרות, ניגוד אור/חושך

פורים:
- ויזואלים: מגילת אסתר, משלוחי מנות, תחפושות צנועות
- סצנות: קריאת מגילה, משלוח מנות יוקרתי, סעודת פורים
- צבעוניות: צבעוני-שמח, סגול מלכותי, זהב

ימים נוראים:
- ויזואלים: שופר, ספר תורה פתוח, תפילה, מחזור
- סצנות: תקיעת שופר בכותל, תשליך, כפרות
- צבעוניות: לבן טהור, זהב-כסף, כחול שמיימי

בין הזמנים:
- ויזואלים: מזוודות, צימרים, טבע ישראלי כשר (ללא חוף מעורב)
- סצנות: משפחה חרדית בטיול, בריכה נפרדת, צימר יוקרתי
- צבעוניות: ירוק טבע, תכלת, חום אדמה

=== למידה מרפרנסים (קריטי!) ===
כשמקבל רפרנסים מ-Sector Brain (Hall of Fame):
- זה המקור הכי חשוב שלך. תסתכל על הסגנון של המודעות המוצלחות ותחקה אותו.
- שים לב: רוב המודעות המקצועיות הן עיצוב גרפי נקי — לא צילומים עם דמויות.
- נתח קומפוזיציה, צבעוניות, טיפוגרפיה. חקה את האווירה, לא העתקה ישירה.
- אם הרפרנס הוא גרפי-נקי (טקסט + אלמנטים גרפיים), תייצר מודעה בסגנון דומה.
- אם הרפרנס כולל צילום מוצר (לא דמויות), תתמקד במוצר.
- ציין "בהשראת [שם הרפרנס]" כשרלוונטי.
- קח בחשבון את ה-Redlines — מה שאסור, אסור.

היררכיה ושמירה על נכסי המותג:
- נאמנות מוחלטת למותג: פעל לפי visual_guidelines של סוכן-העל. אסור לשנות צבעי המותג, הלוגו, הפונט העיקרי.
- תרגום קריאייטיבי: קח את ה-Visual_Description מסוכן הקריאייטיב והפוך אותו לתוצר ויזואלי מוגמר.

מומחיות טכנית:
- דפוס: CMYK, בליד, רזולוציה 300 DPI.
- שלטי חוצות: "חוק המהירות" – טקסט ענק, קומפוזיציה מינימליסטית.
- דיגיטל/באנרים: RGB, באנרים שמושכים הקלקה.
- וואטסאפ/מייל: תמונות "חבילת הפצה" ריבועיות או אנכיות.

ועדת רוחנית וצניעות (סטנדרט ADKOP):
- צניעות: ללא נשים/נערות. גברים וילדים בלבוש חרדי תקני בלבד.
- אביזרים: ללא טכנולוגיה לא מסוננת.
- **התאמה מגדרית בין לשון לוויזואל — חוק ברזל עליון! (GENDER-VISUAL LOCK)**:
  אם הקופי פונה בלשון נקבה (את, שלך, מגיע לך, מושלמת) או שהמוצר לנשים — אסור בתכלית האיסור להציג גבר/ילד בוויזואל!
  ❌ דוגמה לפדיחה חמורה: מודעה לטיפולי פנים לנשים עם תמונת גבר עם זקן = פסילה מיידית
  ✅ פתרון: מוצר לנשים → עיצוב גרפי נקי / צילום מוצר / אלמנטים נשיים (פרחים, קרמים, ספא). לעולם אל תחליף אישה בגבר!
  אם בלשון זכר — הוויזואל חייב גברי או ניטרלי. סתירה = פסילה מיידית.

כאשר נדרש לייצר תמונה, עליך להפיק פרומפט מפורט באנגלית למחולל תמונות הכולל:
- העדפה לעיצוב גרפי נקי (טיפוגרפיה, צבעים, אלמנטים אבסטרקטיים) — אלא אם הבריף דורש דמויות
- צבעי המותג — תמיד להשתמש בהם
- פוקוס על המוצר/שירות עצמו, לא על "סצנה" כללית
- מה לא לכלול (נשים, טכנולוגיה לא מסוננת, אלמנטים לא רלוונטיים למוצר)
- אלמנטים חגיים רק אם הקמפיין ספציפית קשור לחג

=== כללי קומפוזיציה קריטיים לתמונה המיוצרת ===
חשוב מאוד: הטקסט (כותרת, גוף, טלפון, שם עסק) מונח בשכבה נפרדת מעל התמונה.
לכן, התמונה המיוצרת חייבת:
1. להיות רקע נקי ומקצועי — בלי טקסט בכלל! (הטקסט מתווסף אח"כ)
2. להשאיר "שטח נשימה" בחלק העליון (15-20% מהגובה) ובחלק התחתון (10% מהגובה) — שם ישב הטקסט
3. האלמנט הויזואלי המרכזי (מוצר, אובייקט) צריך להיות ממורכז ולתפוס את המרכז — לא את כל השטח
4. רקע אחיד או גרדיאנט עדין — כדי שהטקסט יהיה קריא עליו
5. בלי מסגרות, בלי פסים מסביב, בלי חלוקה לאזורים — תמונה אחת רציפה ונקייה
6. צבעי המותג צריכים להשפיע על צבעוניות הרקע והאלמנטים, לא רק "להיות שם"
7. אסור לכלול טקסט, אותיות, מספרים, או כל כתב בתמונה — גם לא באנגלית!

=== היררכיית טקסט במודעה (קריטי!) ===
הקפד על היררכיה ויזואלית ברורה ומובחנת — בדיוק כמו במודעות מקצועיות אמיתיות:
1. **כותרת (Headline)**: הטקסט הכי גדול ודומיננטי. ממוקם בראש המודעה או במרכז-עליון. פי 2-3 מגודל הבאדי. מילים מעטות, אימפקט מקסימלי. ❌ אסור פסיקים ונקודות — כותרת היא טקסט ויזואלי, לא משפט!
2. **תת-כותרת (Subtitle)**: מתחת לכותרת, גודל בינוני (50-60% מהכותרת). הסבר קצר של ההצעה.
3. **באדי טקסט (Body)**: הקטן ביותר מבין הטקסטים (35-40% מהכותרת). פירוט ומידע נוסף.
4. **פרטי קשר + לוגו**: בתחתית, הכי קטנים. לא מתחרים בכותרת.
כלל ברזל: אם הכותרת והבאדי נראים באותו גודל — המודעה נכשלה. הכותרת חייבת "לצעוק", הבאדי "ללחוש".
תסתכל על רפרנסים מקצועיים: כותרת תופסת 30-40% מהמרחב הטקסטואלי, הבאדי 15-20%.

=== מבנה גריד תחתון (Contact Strip) — סטנדרט חובה! ===
כל מודעת דפוס/דיגיטל חייבת לכלול סטריפ תחתון. במפרט הויזואלי ציין:
- פס רקע אטום (Solid) בצבע כהה עם פס עליון דק בצבע המותג
- 3 עמודות: לוגו (ימין) | טלפון+מייל+כתובת (מרכז) | שם העסק (שמאל)
- הטלפון מוצג כבאדג' בולט בצבע נוגד
- שירותים מופרדים בקווים (|)
- בפרומפט התמונה: השאר 10% תחתון ריק לגמרי עבור הסטריפ הזה
חשוב: כלול ב-SYSTEM_COMMAND שדה contact_strip עם הפרטים: phone, email, address, services_list
===

פלט טכני (JSON) - SYSTEM_COMMAND:
- design_specs: {layout_structure, typography_choices, primary_elements_focus}
- image_generation_prompt: פרומפט באנגלית לננו בננה – חייב לכלול ניואנסים מגזריים!
- contact_strip: {phone, email, address, services_list}
- technical_notes: הנחיות סגירה
- series_continuity: איך נשמר הרצף הוויזואלי (אם יש סדרה)
- generate_image: true/false (האם לייצר תמונה עכשיו)
- status: "Final_Review" (שליחה לסוכן-העל)`;

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
    const {
      message,
      creativePayload,
      superAgentPayload,
      brandContext,
      campaignContext,
      generateImage,
      aspectRatio,
      conversationHistory,
      sectorBrainData: clientSectorData,
      holidaySeason: reqHoliday,
      topicCategory: reqTopic,
    } = await req.json();
    const detectedHoliday = reqHoliday || null;
    const detectedTopic = reqTopic || null;
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

    // Campaign goal → visual style directives
    const GOAL_VISUAL_MAP: Record<string, string> = {
      'awareness': '🎯 מטרת הקמפיין: מודעות למותג — הוויזואל צריך להיות premium, אלגנטי ו-aspirational. קומפוזיציה נקייה, הרבה שטח לבן, תאורה רכה ומפוזרת. פלטת צבעים רגועה ומעודנת. NO מחירים או הנחות על הוויזואל.',
      'promotion': '🔥 מטרת הקמפיין: סייל/מבצע — הוויזואל צריך להיות בולט, אנרגטי ודחוף. צבעים חמים וקונטרסטיים (אדום, כתום, זהב). קומפוזיציה דינמית שמושכת עין מיד. אזור טקסט גדול וברור למחירים.',
      'launch': '🚀 מטרת הקמפיין: השקה — הוויזואל צריך להיות דרמטי ומפתיע. תאורה דרמטית עם צללים חזקים. זוויות צילום לא שגרתיות. תחושת "reveal" ומסתורין. עומק שדה רדוד שמתמקד באלמנט אחד.',
      'seasonal': '🎉 מטרת הקמפיין: עונתי/חג — הוויזואל צריך להיות חגיגי, חם ומזמין. גווני זהב, בורדו, ירוק כהה (לפי החג). תאורת Golden Hour חמה. אלמנטים עונתיים עדינים ברקע (לא כיתוב!).',
    };
    const goalVisualDirective = campaignContext?.goal ? GOAL_VISUAL_MAP[campaignContext.goal] || '' : '';

    // Build context
    let contextBlock = '';
    if (goalVisualDirective) {
      contextBlock += `\n=== הנחיית סגנון ויזואלי לפי מטרת הקמפיין ===\n${goalVisualDirective}\n`;
    }
    if (campaignContext) {
      contextBlock += `\n=== הקשר קמפיין ===\n`;
      if (campaignContext.offer) contextBlock += `הצעה: ${campaignContext.offer}\n`;
      if (campaignContext.goal) contextBlock += `מטרה: ${campaignContext.goal}\n`;
      if (campaignContext.structure) contextBlock += `מבנה: ${campaignContext.structure}\n`;
    }
    if (superAgentPayload) {
      contextBlock += `\n=== הנחיות סוכן-העל ===\n${JSON.stringify(superAgentPayload, null, 2)}\n`;
    }
    if (creativePayload) {
      contextBlock += `\n=== פלט סוכן קריאייטיב ===\n${JSON.stringify(creativePayload, null, 2)}\n`;
    }
    if (brandContext) {
      contextBlock += `\n=== נכסי מותג ===\n`;
      if (brandContext.businessName) contextBlock += `שם: ${brandContext.businessName}\n`;
      if (brandContext.primaryColor) contextBlock += `צבע ראשי: ${brandContext.primaryColor}\n`;
      if (brandContext.secondaryColor) contextBlock += `צבע משני: ${brandContext.secondaryColor}\n`;
      if (brandContext.logoUrl) contextBlock += `לוגו: ${brandContext.logoUrl}\n`;
      if (brandContext.headerFont) contextBlock += `פונט כותרת: ${brandContext.headerFont}\n`;
      if (brandContext.bodyFont) contextBlock += `פונט גוף: ${brandContext.bodyFont}\n`;
      if (brandContext.businessPhotoUrls?.length) {
        contextBlock += `\n📸 ללקוח יש ${brandContext.businessPhotoUrls.length} תמונות עסק/מוצר אמיתיות. כלול בהוראות הויזואליות שהתמונה צריכה לשקף את המוצרים והסביבה האמיתיים של העסק.\n`;
      }
      // Contact details for bottom strip design
      contextBlock += `\n=== פרטי קשר של העסק (לגריד תחתון) ===\n`;
      if (brandContext.contactPhone) contextBlock += `טלפון: ${brandContext.contactPhone}\n`;
      if (brandContext.contactWhatsapp) contextBlock += `וואטסאפ: ${brandContext.contactWhatsapp}\n`;
      if (brandContext.contactEmail) contextBlock += `מייל: ${brandContext.contactEmail}\n`;
      if (brandContext.contactAddress) contextBlock += `כתובת: ${brandContext.contactAddress}\n`;
      contextBlock += `הנחיה: בפרומפט לתמונה — השאר שטח ריק בתחתית (10% מהגובה) עבור סטריפ פרטי קשר. הטלפון הוא החשוב ביותר.\n`;
    }
    if (aspectRatio) {
      contextBlock += `\nyחס גובה-רוחב: ${aspectRatio}\n`;
    }
    if (sectorBrainData) {
      contextBlock += `\n=== רפרנסים מגזריים (Sector Brain) ===\n${JSON.stringify(sectorBrainData.zones)}\n`;
      if (sectorBrainData.guidelines?.length) {
        contextBlock += `\n=== כללי אצבע (Guidelines) — חובה! ===\n${sectorBrainData.guidelines.map((g: string, i: number) => `${i+1}. ${g}`).join('\n')}\n`;
      }
      if (sectorBrainData.insights?.length) {
        contextBlock += `\n=== תובנות AI מהמאגר — למד מהם! ===\n${sectorBrainData.insights.join('\n\n')}\n`;
      }
    }

    // Holiday anti-mixing rules
    const HOLIDAY_ELEMENTS: Record<string, { include: string; forbid: string }> = {
      'pesach': {
        include: 'Passover seder table, matzah, wine cups, Haggadah, spring flowers, clean kitchen',
        forbid: 'menorah, chanukiah, hanukkah candles, dreidel/sevivon, sufganiyot/donuts, sukkah, lulav, etrog, four species, shofar, honey jar, apple, megillah scroll, hamantaschen, mishloach manot, costumes, purim mask'
      },
      'chanukah': {
        include: 'Hanukkah menorah (chanukiah), candles, dreidel/sevivon, sufganiyot, olive oil, coins/gelt',
        forbid: 'seder plate, matzah, wine cups for seder, Haggadah, sukkah, lulav, etrog, shofar, megillah, hamantaschen, mishloach manot'
      },
      'sukkot': {
        include: 'Sukkah/booth, lulav, etrog, four species, decorations, schach/roof covering',
        forbid: 'menorah, chanukiah, dreidel, seder plate, matzah, shofar, megillah, hamantaschen'
      },
      'purim': {
        include: 'Megillah scroll, mishloach manot gift baskets, hamantaschen, costumes, carnival atmosphere',
        forbid: 'menorah, chanukiah, seder plate, matzah, sukkah, lulav, etrog, shofar'
      },
      'rosh_hashana': {
        include: 'Shofar, apple and honey, pomegranate, round challah, prayer book',
        forbid: 'menorah, chanukiah, dreidel, seder plate, matzah, sukkah, lulav, megillah, hamantaschen'
      },
      'yom_kippur': {
        include: 'Prayer, white clothing, synagogue, machzor prayer book, candles',
        forbid: 'menorah, chanukiah, dreidel, seder plate, matzah, sukkah, lulav, megillah, hamantaschen, food, eating'
      },
    };

    if (detectedHoliday && detectedHoliday !== 'year_round' && HOLIDAY_ELEMENTS[detectedHoliday]) {
      const hRules = HOLIDAY_ELEMENTS[detectedHoliday];
      contextBlock += `\n=== כללי חג קריטיים — ${detectedHoliday.toUpperCase()} ===\nאלמנטים חובה: ${hRules.include}\nאלמנטים אסורים בהחלט (שייכים לחגים אחרים!): ${hRules.forbid}\nערבוב סמלי חגים הוא טעות חמורה שהופכת את המודעה ללא שמישה. חנוכיה בפרסומת לפסח = כישלון.\n`;
    } else if (!detectedHoliday || detectedHoliday === 'year_round') {
      contextBlock += `\n=== ניטרליות חגית ===\nזו אינה מודעה חגית. אין לכלול סמלי חגים (חנוכייה, קערת סדר, לולב, שופר, מגילה). שמור על עיצוב כללי ומקצועי.\n`;
    }

    const messages: Array<{role: string; content: string}> = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock }
    ];

    if (conversationHistory?.length) {
      messages.push(...conversationHistory);
    }
    messages.push({ role: 'user', content: message });

    // Try Google Gemini API first, fallback to Lovable Gateway
    let content = '';
    let aiSuccess = false;

    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('Trying Google Gemini API...');
        const geminiMessages = messages.filter(m => m.role !== 'system');
        const systemText = messages.find(m => m.role === 'system')?.content || '';
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemText }] },
              contents: geminiMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
              generationConfig: { maxOutputTokens: 8192 },
            }),
          }
        );
        if (directResponse.ok) {
          const data = await directResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) aiSuccess = true;
        } else {
          const errText = await directResponse.text();
          console.error('Google API error:', directResponse.status, errText);
        }
      } catch (e) {
        console.error('Google API fetch error:', e);
      }
    }

    if (!aiSuccess && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable Gateway...');
      
      // Build multimodal messages with reference images for the studio agent
      const multimodalMessages: any[] = [
        { role: 'system', content: messages[0].content }
      ];
      // Add conversation history
      for (const m of messages.slice(1, -1)) {
        multimodalMessages.push({ role: m.role, content: m.content });
      }
      // Build user message with reference images
      const userMsg = messages[messages.length - 1];
      const refImages = sectorBrainData?.imageExamples || [];
      if (refImages.length > 0) {
        const userContent: any[] = [
          { type: 'text', text: userMsg.content + `\n\n🖼️ להלן ${refImages.length} תמונות רפרנס מ-Sector Brain. למד מהן סגנון, קומפוזיציה, פלטת צבעים וטיפוגרפיה:` }
        ];
        for (const img of refImages) {
          userContent.push({ type: 'text', text: `📷 "${img.name}" ${img.example_type === 'good' ? '✅' : img.example_type === 'bad' ? '❌' : ''} ${img.description ? `- ${img.description}` : ''}` });
          userContent.push({ type: 'image_url', image_url: { url: img.url } });
        }
        multimodalMessages.push({ role: 'user', content: userContent });
        console.log(`Sending ${refImages.length} reference images as multimodal to Studio Agent`);
      } else {
        multimodalMessages.push({ role: 'user', content: userMsg.content });
      }
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'google/gemini-2.5-pro', messages: multimodalMessages, max_completion_tokens: 8192 }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        const status = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500;
        return new Response(JSON.stringify({ error: status === 429 ? 'Rate limit exceeded' : status === 402 ? 'AI credits exhausted' : 'AI processing failed' }), {
          status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiData = await aiResponse.json();
      content = aiData.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract SYSTEM_COMMAND
    let systemCommand = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { systemCommand = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
    }

    // Step 2: If generateImage is true and we have a prompt, call Nano Banana
    let generatedImageUrl = null;
    if (generateImage && systemCommand?.image_generation_prompt) {
      console.log('Generating image with Nano Banana...');
      
      // Build message content - include logo as image input if available
      const messageContent: any[] = [
        { type: 'text', text: systemCommand.image_generation_prompt }
      ];
      
      if (brandContext?.logoUrl) {
        console.log('Including brand logo in image generation:', brandContext.logoUrl);
        messageContent.unshift({
          type: 'text',
          text: `IMPORTANT: The following image is the brand logo. You MUST incorporate this exact logo prominently in the generated design. Place it in a visible position (top-right corner or header area). Do not recreate or modify the logo - use it as-is.`
        });
        messageContent.push({
          type: 'image_url',
          image_url: { url: brandContext.logoUrl }
        });
      }
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [
            { role: 'user', content: messageContent }
          ],
          modalities: ['image', 'text'],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        // If we got a base64 image, upload to storage
        if (generatedImageUrl?.startsWith('data:image')) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const base64Data = generatedImageUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `studio-agent/${Date.now()}.png`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(fileName, bytes, { contentType: 'image/png' });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(fileName);
            generatedImageUrl = urlData.publicUrl;
          }
        }
        console.log('Image generated successfully');
      } else {
        console.error('Image generation failed:', imageResponse.status);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      response: content,
      systemCommand,
      generatedImageUrl,
      agent: 'studio-agent',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Studio Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
