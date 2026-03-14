import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { brief, brandContext, targetGender, targetStream, contactPhone } = await req.json();

    // Determine voice direction
    const voiceGender = targetGender === "women" ? "נשי" : "גברי";
    const voiceStyle = getVoiceStyle(targetStream);
    const toneDirection = getToneDirection(brief);

    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!GEMINI_KEY && !LOVABLE_KEY) {
      throw new Error("No AI API key configured");
    }

    const systemPrompt = `אתה קופירייטר מקצועי לספוטים ברדיו בשוק החרדי/דתי בישראל.
אתה כותב תסריטים לפרסומות רדיו באורך 20-30 שניות.

כללים חשובים:
1. כל תסריט חייב להסתיים עם הנעה לפעולה ומספר טלפון
2. השפה חייבת להיות בעברית תקנית ונקייה
3. התסריט חייב להיות מותאם לקהל היעד
4. ציין הנחיות קריינות מדויקות: טון, קצב, הדגשות
5. התסריט חייב לכלול סימני פיסוק מלאים ונקודות לקריינות
6. הוסף ניקוד למילים שעלולות להיקרא לא נכון

הנחיות קול:
- מגדר קריין: ${voiceGender}
- סגנון: ${voiceStyle}
- טון: ${toneDirection}`;

    const userPrompt = `צור 2 גרסאות תסריט רדיו עבור הקמפיין הבא:

שם העסק: ${brandContext?.businessName || "העסק"}
הבשורה המרכזית: ${brief?.offer || ""}
מטרת הקמפיין: ${brief?.adGoal || brief?.goal || ""}
טון רגשי: ${brief?.emotionalTone || "מקצועי"}
קהל יעד: ${brandContext?.targetAudience || "כללי"}
טלפון ליצירת קשר: ${contactPhone || ""}
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
      "script": "הטקסט המלא של התסריט עם ניקוד למילים קשות",
      "scriptWithNikud": "הטקסט עם ניקוד מלא לקריינות",
      "duration": "25 שניות",
      "voiceNotes": "הנחיות ספציפיות לקריין עבור הגרסה הזו"
    },
    {
      "id": "informational", 
      "title": "גרסה אינפורמטיבית",
      "description": "תסריט מידעי שבונה אמון ומודעות",
      "script": "הטקסט המלא של התסריט עם ניקוד למילים קשות",
      "scriptWithNikud": "הטקסט עם ניקוד מלא לקריינות",
      "duration": "25 שניות",
      "voiceNotes": "הנחיות ספציפיות לקריין עבור הגרסה הזו"
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
      const key = LOVABLE_KEY || GEMINI_KEY;
      if (!key) throw new Error("No AI API key configured");

      const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
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
