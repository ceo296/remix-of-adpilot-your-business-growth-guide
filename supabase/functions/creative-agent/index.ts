import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchSectorBrainFromDB(holidaySeason?: string | null, topicCategory?: string | null) {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const selectFields = 'name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type';
    
    let topicExamples: any[] = [];
    if (topicCategory) {
      const { data } = await supabase.from('sector_brain_examples').select(selectFields).eq('topic_category', topicCategory).limit(30);
      topicExamples = data || [];
    }
    let holidayExamples: any[] = [];
    if (holidaySeason && holidaySeason !== 'year_round') {
      const { data } = await supabase.from('sector_brain_examples').select(selectFields).eq('holiday_season', holidaySeason).limit(30);
      holidayExamples = data || [];
    }
    const remainingQuota = Math.max(10, 50 - topicExamples.length - holidayExamples.length);
    const generalQuery = supabase.from('sector_brain_examples').select(selectFields).limit(remainingQuota);
    if (topicCategory) generalQuery.or(`topic_category.is.null,topic_category.neq.${topicCategory}`);
    if (holidaySeason && holidaySeason !== 'year_round') generalQuery.or(`holiday_season.is.null,holiday_season.eq.year_round`);
    const { data: generalData, error } = await generalQuery;
    if (error) return null;
    const seen = new Set<string>();
    const allExamples: any[] = [];
    for (const item of [...topicExamples, ...holidayExamples, ...(generalData || [])]) {
      if (!seen.has(item.name)) { seen.add(item.name); allExamples.push(item); }
    }
    if (!allExamples.length) return null;
    const grouped: Record<string, typeof allExamples> = {};
    for (const item of allExamples) { const zone = item.zone || 'general'; if (!grouped[zone]) grouped[zone] = []; grouped[zone].push(item); }
    return { total_examples: allExamples.length, topic_specific_count: topicExamples.length, topic: topicCategory || null, holiday_specific_count: holidayExamples.length, holiday: holidaySeason || null, zones: grouped, summary: Object.entries(grouped).map(([z, items]) => `${z}: ${items.length} דוגמאות`).join(', ') };
  } catch { return null; }
}

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה קופירייטר חרדי בכיר, חד, יצירתי ופורץ דרך. אתה לא רק כותב "מילים", אתה "איש קונספט". המטרה שלך היא לייצר קמפיינים שגורמים לקהל החרדי לעצור, להתרגש ולהגיד "וואו". אתה פועל תחת הנחיות סוכן-העל (האסטרטג) ומחויב ל-DNA של המותג ולערכיו.

=== כללי ברזל לקריאייטיב ===
1. כל כותרת חייבת להיות שנונית, חדה, בלתי נשכחת — כמו כותרת עיתון שעוצרת אנשים ברחוב
2. חפש תמיד משחק מילים, ביטוי מפתיע, טוויסט, או ניגוד מעניין
3. השתמש בביטויים מעולם התורה, הגמרא, ההלכה, המשנה, הפיוטים — ותחבר אותם בצורה שנונה לעולם הפרסום
4. איסור מוחלט על קלישאות עצלניות: "הכי טוב", "מקצועי ואיכותי", "שירות מעולה", "פתרון מושלם" — אלה מילות סרק
5. כל קונספט חייב לגרום לקורא לחייך, להתרגש, או לעצור ולקרוא שוב
6. שפה תקנית וגבוהה, אבל לא מיושנת — חיה, קצבית, עם אנרגיה
7. למד מהרפרנסים של Sector Brain: שים לב לסגנון הכותרות, משחקי המילים, הטוויסטים. העלה את הרמה שלך לפחות לרמה שלהם
===

=== מנוע ניואנסים חג-ספציפיים ===
כשהקמפיין קשור לחג — חובה לשלב ניואנסים מגזריים אמיתיים, לא סתם "לקראת החג":
- פסח: "מה נשתנה" כטוויסט, "לצאת מהמצרים/מיצרים", "דיינו" כהפוך, "עבדים היינו ל...", קמחא דפסחא, הגעלה, מצה שמורה, "שמורה מכל משמר", ליל הסדר, 4 כוסות, אפיקומן
- סוכות: "ושמחת בחגך", אושפיזין, "חג האסיף" = לאסוף הזדמנויות, שמחת בית השואבה, ארבעת המינים, "אתרוג מהודר"
- חנוכה: "מוסיף והולך" = צמיחה/הנחות גדלות, "נס גדול היה פה", "מעט מן האור דוחה הרבה מן החושך", שמן זית, סופגניות
- פורים: "נהפוך הוא" = טוויסט/הפתעה, "ליהודים היתה אורה", משלוח מנות, מגילה, "עד דלא ידע"
- ימים נוראים: "המלך בשדה", תשובה/תפילה/צדקה, שופר, "כתיבה וחתימה טובה", תפוח בדבש, סימנים
- שבועות: "נעשה ונשמע", לימוד כל הלילה, מאכלי חלב, "זמן מתן תורתנו", מגילת רות
- בין הזמנים: לא "חופש גדול" אלא "בין הזמנים", יציאה מהכולל/ישיבה, נופש משפחתי, "להעלות את הסוללות"
===

היררכיה:
- נאמנות ל-Payload: גזור את טון הכתיבה מהערכים שהוגדרו ב-JSON של סוכן-העל (main_emotion, strategy, style).
- גמישות יצירתית מבוססת אסטרטגיה: אין "חוקים סגורים" לפי תחומים. בדוק בכל קמפיין מחדש מה משרת את המטרה.
- נאמנות למהות המותג (Brand Integrity).

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

שיטת עבודה:
- סבב א': 3 קונספטים שונים (רגשי, תועלתי, יצירתי/מפתיע).
- סבבי תיקון: אופציה אחת מלוטשת בלבד.

פלט טכני (JSON) - SYSTEM_COMMAND:
- creative_options: [{headline, body_text, cta, visual_description, radio_script, social_text}]
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
      contextBlock += `\n=== נכסי מותג ===\n`;
      if (brandContext.businessName) contextBlock += `שם: ${brandContext.businessName}\n`;
      if (brandContext.primaryColor) contextBlock += `צבע ראשי: ${brandContext.primaryColor}\n`;
      if (brandContext.secondaryColor) contextBlock += `צבע משני: ${brandContext.secondaryColor}\n`;
      if (brandContext.xFactors?.length) contextBlock += `גורמי X: ${brandContext.xFactors.join(', ')}\n`;
    }

    if (campaignContext) {
      contextBlock += `\n=== הקשר קמפיין ===\n`;
      if (campaignContext.goal) contextBlock += `מטרה: ${campaignContext.goal}\n`;
      if (campaignContext.vibe) contextBlock += `וייב: ${campaignContext.vibe}\n`;
      if (campaignContext.structure) contextBlock += `מבנה: ${campaignContext.structure}\n`;
      if (campaignContext.timing) contextBlock += `טיימינג: ${campaignContext.timing}\n`;
      if (campaignContext.mediaTypes?.length) contextBlock += `סוגי מדיה: ${campaignContext.mediaTypes.join(', ')}\n`;
    }

    if (sectorBrainData) {
      contextBlock += `\n=== רפרנסים מגזריים (Sector Brain) ===\n`;
      if (sectorBrainData.domain_topic) {
        contextBlock += `תחום רלוונטי: ${sectorBrainData.domain_topic} (${sectorBrainData.domain_specific_count} דוגמאות ספציפיות)\n`;
        contextBlock += `חשוב: תעדיף את הרפרנסים מהתחום הזה. הם הכי רלוונטיים לקמפיין.\n`;
      }
      contextBlock += JSON.stringify(sectorBrainData.zones) + '\n';
    }

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
              generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
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

    // Attempt 2: Lovable AI Gateway fallback
    if (!aiSuccess && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable AI Gateway...');
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-mini',
          messages,
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
