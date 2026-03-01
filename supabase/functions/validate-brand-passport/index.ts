import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandPassportData {
  businessName: string;
  industry: string;
  seniority: string;
  audience: string;
  coreOffering: string;
  xFactors: string[];
  primaryXFactor: string | null;
  otherXFactor: string;
  xFactorDetails: Record<string, string>;
  advantageType: 'hard' | 'soft' | null;
  pricePosition: number; // -100 to 100
  stylePosition: number; // -100 to 100
  competitors: string[];
  noCompetitors: boolean;
  endConsumer: string;
  decisionMaker: string;
}

interface ValidationIssue {
  type: 'warning' | 'suggestion';
  category: 'inconsistency' | 'sparse_data' | 'improvement';
  message: string;
  field?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
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
    const data: BrandPassportData = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build xFactor details string
    const xFactorDetailsStr = Object.entries(data.xFactorDetails || {})
      .filter(([_, v]) => v?.trim())
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');

    const prompt = `אתה מנתח אסטרטגי של מותגים בשוק החרדי. נתונים הבאים הוזנו עבור מותג:

שם העסק: ${data.businessName || 'לא צוין'}
תחום פעילות: ${data.industry || 'לא צוין'}
ותק בשוק: ${data.seniority || 'לא צוין'}
קהל יעד: ${data.audience || 'לא צוין'}
הצעת הערך: ${data.coreOffering || 'לא צוין'}

גורמים מבדלים שנבחרו: ${data.xFactors.length > 0 ? data.xFactors.join(', ') : 'לא נבחרו'}
${xFactorDetailsStr ? `פירוט הגורמים המבדלים:\n${xFactorDetailsStr}` : ''}
${data.otherXFactor ? `גורם מבדל מותאם אישית: ${data.otherXFactor}` : ''}
גורם מבדל עיקרי: ${data.primaryXFactor || 'לא נבחר'}

סוג היתרון: ${data.advantageType === 'hard' ? 'יתרון פיזי/מוצרי' : data.advantageType === 'soft' ? 'יתרון תדמיתי/רגשי' : 'לא נבחר'}
מיקום מחיר: ${data.pricePosition > 30 ? 'פרימיום' : data.pricePosition < -30 ? 'משתלם/זול' : 'ביניים'}
מיקום סגנון: ${data.stylePosition > 30 ? 'מודרני' : data.stylePosition < -30 ? 'קלאסי/מסורתי' : 'ביניים'}

מתחרים: ${data.noCompetitors ? 'אין מתחרים' : (data.competitors.length > 0 ? data.competitors.join(', ') : 'לא צוינו')}
צרכן סופי: ${data.endConsumer || 'לא צוין'}
מקבל ההחלטות: ${data.decisionMaker || 'לא צוין'}

נתח את המידע וזהה:
1. חוסרי התאמה לוגיים ברורים ומוחשיים (למשל: טוענים שהם הכי זולים אבל ממוקמים כפרימיום)
2. מידע דל מאוד שחיוני לעבודה (למשל: אין גורם מבדל כלל)
3. הזדמנויות לשיפור משמעותי בלבד

כללים חשובים:
- אל תתייחס ל"קהל חרדי" כ"שמרני" באופן אוטומטי. עסקים חרדיים רבים משתמשים בעיצוב מודרני וחדשני. אל תסמן סגנון "מודרני" כבעיה רק בגלל שהקהל חרדי.
- אל תדווח על "התנגשויות" שאינן התנגשויות אמיתיות. בדוק שיש סתירה לוגית ממשית לפני שמסמן אזהרה.
- החזר רק בעיות אמיתיות ומשמעותיות. עדיף 0-2 אזהרות מדויקות מ-5 אזהרות מיותרות.
- אם יש פירוט של הגורם המבדל, קח אותו בחשבון לפני שמסמן "חסר גורם מבדל".

חזור עם מערך JSON של בעיות. כל בעיה צריכה להיות אובייקט עם:
- type: "warning" (לחוסרי התאמה לוגיים חמורים) או "suggestion" (להמלצות)
- category: "inconsistency" (חוסר התאמה), "sparse_data" (מידע דל), או "improvement" (הזדמנות)
- message: הסבר קצר וברור בעברית (עד 50 מילים)
- field: השדה הרלוונטי (אופציונלי)

אם אין בעיות משמעותיות, החזר מערך ריק [].
חזור רק עם ה-JSON, בלי טקסט נוסף.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה מומחה לאסטרטגיה שיווקית ומיתוג בשוק החרדי. תפקידך לזהות חוסרי עקביות ובעיות במידע עסקי. ענה תמיד ב-JSON בלבד." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze brand passport");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON response
    let issues: ValidationIssue[] = [];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      issues = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      issues = [];
    }

    return new Response(JSON.stringify({ issues }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("validate-brand-passport error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
