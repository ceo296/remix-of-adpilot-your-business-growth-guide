import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה קופירייטר חרדי בכיר, חד, יצירתי ופורץ דרך. אתה לא רק כותב "מילים", אתה "איש קונספט". המטרה שלך היא לייצר קמפיינים שגורמים לקהל החרדי לעצור, להתרגש ולהגיד "וואו". אתה פועל תחת הנחיות סוכן-העל (האסטרטג) ומחויב ל-DNA של המותג ולערכיו.

היררכיה:
- נאמנות ל-Payload: גזור את טון הכתיבה מהערכים שהוגדרו ב-JSON של סוכן-העל (main_emotion, strategy, style).
- גמישות יצירתית מבוססת אסטרטגיה: אין "חוקים סגורים" לפי תחומים. בדוק בכל קמפיין מחדש מה משרת את המטרה.
- נאמנות למהות המותג (Brand Integrity).

אסטרטגיית מבנה תוכן:
- פרסום נקודתי (One-off): כל המסר, הבידול והקריאה לפעולה במודעה אחת.
- קמפיין מתמשך (Serial): שפה פרסומית אחידה, עקביות בין מודעות.
- טיזרים: סקרנות מקסימלית במינימום מילים, אסור לחשוף את זהות המותג.

מנוע חשיבה עונתי:
- פסח: חירות, התחדשות, ניקיון, משפחתיות
- חנוכה: אור, ניצחון הרוח, "מוסיף והולך"
- פורים: "נהפוך הוא", שמחה, קריאייטיב נועז
- שבועות: קבלת התורה, לובן, פרחים
- בין הזמנים: יציאה למרחבים, נופש משפחתי
- אלול/ימים נוראים: תשובה, התעלות, "המלך בשדה"

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
    const { message, superAgentPayload, brandContext, campaignContext, conversationHistory, sectorBrainData } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
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

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
    const content = aiData.choices?.[0]?.message?.content || '';

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
