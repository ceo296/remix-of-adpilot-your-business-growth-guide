import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { brief, brandContext, targetGender, targetStream, contactPhone, profileData, fixInstruction, fixType, originalScript } = body;
    
    // Support both brandContext and profileData (fallback)
    const businessName = brandContext?.businessName || profileData?.businessName || 'העסק';
    const targetAudience = brandContext?.targetAudience || profileData?.targetAudience || 'כללי';
    const phone = contactPhone || profileData?.phone || '';
    const services = profileData?.services?.join(', ') || brandContext?.services || '';
    const winningFeature = profileData?.winningFeature || brandContext?.winningFeature || '';

    // Auto-detect voice gender: women-focused businesses get female voice
    const isWomenFocused = targetGender === "women" || 
      /נשים|נשי|כלות|אופנה נשית|בגדי נשים|קוסמטיקה|שמלות|תכשיטים/i.test(targetAudience || '');
    const voiceGender = isWomenFocused ? "נשי" : "גברי";
    const voiceStyle = getVoiceStyle(targetStream);
    const toneDirection = getToneDirection(brief);

    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!GEMINI_KEY && !LOVABLE_KEY) {
      throw new Error("No AI API key configured");
    }

    const systemPrompt = `אתה קופירייטר מקצועי לספוטים ברדיו בשוק החרדי/דתי בישראל.
אתה כותב תסריטים לפרסומות רדיו באורך 15-20 שניות בלבד (לא יותר!).

=== אורך ופורמט ===
- תסריט = 4-6 משפטים קצרים וחדים, לא יותר!
- כל משפט = 5-10 מילים מקסימום
- אסור "מילוי" — כל מילה חייבת לשרת את המסר
- 15-20 שניות קריאה, לא 25-30!

=== פתיחה קריאייטיבית (חובה!) ===
- המשפט הראשון חייב להיות הוק יצירתי שתופס תשומת לב מיידית
- אסור לפתוח ב"שלום", "הי", "חברים", "רבותיי" — זה משעמם!
- טכניקות פתיחה מחייבות (בחר אחת):
  * אפקט קולי/סאונד + משפט פרובוקטיבי ("נשמע קול שופר... הגאולה של הארנק שלך הגיעה!")
  * שאלה חדה שמעוררת סקרנות ("מתי בפעם האחרונה שילמת פחות ממה שציפית?")
  * סצנה מיניאטורית/סיפור קצרצר ("יום שישי, 12:00. הטלפון מצלצל. ומשה כבר מחייך.")
  * משפט שובר ציפייה ("תשכחו מכל מה שידעתם על...")
  * צליל/הדמיה קולית ("טיק טוק... הזמן אוזל!")
- הפתיחה חייבת להיות מפתיעה — לא צפויה, לא גנרית, לא קלישאתית

=== חובה מוחלטת: שימוש בנתוני העסק בלבד ===
- חובה להשתמש בשם העסק המדויק שסופק: "${businessName}"
- חובה להשתמש בטלפון שסופק: "${phone}"
- חובה להתייחס לשירותים/מוצרים שסופקו בלבד
- אסור בשום אופן להמציא שירותים, מוצרים, כתובות או מספרי טלפון!
- אם לא סופק מספר טלפון — אל תמציא. כתוב "לפרטים חפשו ${businessName}"

כללים חשובים:
1. כל תסריט חייב להסתיים עם הנעה לפעולה ומספר טלפון (אם סופק)
2. השפה חייבת להיות בעברית תקנית ונקייה — שפה מכובדת, ללא סלנג חילוני
3. התסריט חייב להיות מותאם לקהל היעד
4. ציין הנחיות קריינות מדויקות: טון, קצב, הדגשות
5. התסריט חייב לכלול סימני פיסוק מלאים ונקודות לקריינות
6. הוסף ניקוד למילים שעלולות להיקרא לא נכון
7. הבשורה המרכזית מהבריף (offer) חייבת להופיע בתסריט! אסור להחליף אותה במסר רגשי כללי.

=== גארדריילס מגזריים (חובה!) ===
- איסור מוחלט על רמיזות מיניות, דו-משמעות מינית, או שפה אינטימית/פלרטטנית
- איסור על ניסוחים כמו: "מחכה לך", "תשוקה", "פיתוי", "להתמסר" כשהם עלולים להישמע מיניים
- אסור שפה של חיי לילה: "מועדון", "מסיבה", "פאב", "בר" (אלא אם מדובר ב"מועדון לקוחות")
- אסור הומור שמלגלג על דת, רבנים, מנהגים, או קהילות
- אסור להזכיר את שם ה' המפורש
- אסור שפה אגרסיבית או מתריסה כלפי המסורת
- אסור קלישאות: "הכי טוב", "מקצועי ואיכותי", "שירות מעולה" — חפש טוויסט!
- עקביות מגדרית: אם פונים בלשון זכר — כל התסריט בלשון זכר. אם נקבה — כולו בנקבה. אסור לערבב!
- בדיקה עצמית: לפני שליחה — "האם משפט כלשהו יכול להתפרש בצורה לא ראויה?" אם כן — כתוב מחדש.
===

הנחיות קול:
- מגדר קריין: ${voiceGender}
- סגנון: ${voiceStyle}
- טון: ${toneDirection}`;

    let fixContext = '';
    if (fixInstruction && originalScript) {
      fixContext = `\n\n=== הנחיות תיקון ===
הלקוח ביקש לתקן את התסריט הבא:
"${originalScript}"

סוג התיקון: ${fixType === 'message' ? 'שינוי מסר' : fixType === 'length' ? 'שינוי אורך' : 'הוספת תוכן'}
הנחיות: ${fixInstruction}

צור 2 גרסאות מתוקנות בהתאם לבקשה. שמור על כל מה שלא ביקש לשנות.`;
    }

    // Fetch sector brain references for radio
    let sectorContext = '';
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: guidelines } = await supabase
        .from('sector_brain_examples')
        .select('text_content')
        .eq('is_general_guideline', true)
        .not('text_content', 'is', null)
        .limit(5);
      const { data: refs } = await supabase
        .from('sector_brain_examples')
        .select('name, text_content')
        .eq('is_general_guideline', false)
        .eq('example_type', 'good')
        .not('text_content', 'is', null)
        .in('media_type', ['radio', 'copy', 'ad_copy'])
        .limit(4);
      const { data: insights } = await supabase
        .from('sector_brain_insights')
        .select('content')
        .eq('is_active', true)
        .limit(3);

      const parts: string[] = [];
      if (guidelines?.length) parts.push(`## הנחיות סקטוריאליות\n${guidelines.map(g => g.text_content).join('\n')}`);
      if (insights?.length) parts.push(`## תובנות\n${insights.map(i => i.content).join('\n')}`);
      if (refs?.length) parts.push(`## דוגמאות מוצלחות כהשראה\n${refs.map((r, i) => `--- דוגמה ${i+1} (${r.name}) ---\n${(r.text_content || '').substring(0, 500)}`).join('\n\n')}`);
      if (parts.length) sectorContext = `\n\n🧠 רפרנסים סקטוריאליים:\n${parts.join('\n\n')}`;
    } catch (e) { console.warn('Sector brain fetch failed:', e); }

    const userPrompt = `צור 2 גרסאות תסריט רדיו עבור הקמפיין הבא:${fixContext}${sectorContext}

=== נתוני העסק (חובה להשתמש רק בנתונים הבאים!) ===
שם העסק: ${businessName}
שירותים/מוצרים: ${services || 'לא פורט — השתמש בבשורה מהבריף'}
יתרון מרכזי: ${winningFeature || 'לא פורט'}
טלפון ליצירת קשר: ${phone || 'לא סופק — אל תמציא!'}
קהל יעד: ${targetAudience}

=== בריף הקמפיין ===
הבשורה המרכזית: ${brief?.offer || "לא סופק"}
מטרת הקמפיין: ${brief?.adGoal || brief?.goal || "לא סופק"}
טון רגשי: ${brief?.emotionalTone || "מקצועי"}
${brief?.priceOrBenefit ? `מחיר/הטבה: ${brief.priceOrBenefit}` : ""}
${brief?.timeLimitText ? `מגבלת זמן: ${brief.timeLimitText}` : ""}

החזר JSON בפורמט הבא בלבד (ללא markdown):
{
  "voiceDirection": {
    "gender": "${voiceGender}",
    "style": "${voiceStyle}",
    "tone": "${toneDirection}",
    "pace": "רגוע/בינוני/מהיר",
    "notes": "הערות נוספות לקריין"
  },
  "scripts": [
    {
      "id": "sales",
      "title": "גרסה מכירתית",
      "description": "תסריט ממוקד מכירות עם הנעה חזקה לפעולה",
      "script": "הטקסט המלא של התסריט",
      "scriptWithNikud": "הטקסט עם ניקוד מלא לקריינות",
      "duration": "15-20 שניות",
      "voiceNotes": "הנחיות ספציפיות לקריין"
    },
    {
      "id": "informational", 
      "title": "גרסה אינפורמטיבית",
      "description": "תסריט מידעי שבונה אמון ומודעות",
      "script": "הטקסט המלא של התסריט",
      "scriptWithNikud": "הטקסט עם ניקוד מלא לקריינות",
      "duration": "15-20 שניות",
      "voiceNotes": "הנחיות ספציפיות לקריין"
    }
  ]
}`;

    let result: any;
    let rawText = '';

    // Try Gemini first, then fallback to Lovable Gateway
    let geminiSuccess = false;
    if (GEMINI_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
              ],
              generationConfig: { temperature: 0.8, maxOutputTokens: 4000 },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          geminiSuccess = true;
        } else {
          console.warn("Gemini failed, falling back to Gateway:", geminiRes.status);
        }
      } catch (e) {
        console.warn("Gemini error, falling back to Gateway:", e);
      }
    }

    if (!geminiSuccess) {
      const GATEWAY_KEY = LOVABLE_KEY;
      if (!GATEWAY_KEY) throw new Error("No AI API key configured for fallback");

      const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GATEWAY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
        }),
      });

      if (!gatewayRes.ok) {
        const status = gatewayRes.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Gateway error: ${status}`);
      }

      const gatewayData = await gatewayRes.json();
      rawText = gatewayData.choices?.[0]?.message?.content || "";
    }

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-radio-script error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getVoiceStyle(stream?: string): string {
  if (!stream) return "חם ומקצועי";
  switch (stream) {
    case "חסידי": return "חם, סמכותי, עם ניגון חסידי עדין";
    case "ליטאי": return "רציני, מדויק, מקצועי";
    case "ספרדי": return "חם, רגשי, קרוב";
    case "דתי-לאומי": return "צעיר, דינמי, ישראלי";
    case "חרדי-מודרני": return "מודרני, נגיש, מקצועי";
    default: return "חם ומקצועי";
  }
}

function getToneDirection(brief: any): string {
  const tone = brief?.emotionalTone;
  switch (tone) {
    case "luxury": return "יוקרתי, שקט ובוטח";
    case "urgency": return "דחוף, אנרגטי, מניע לפעולה";
    case "belonging": return "חם, משפחתי, שייכות";
    case "professional": return "מקצועי, מדויק, אמין";
    default: return "חם ומקצועי";
  }
}
