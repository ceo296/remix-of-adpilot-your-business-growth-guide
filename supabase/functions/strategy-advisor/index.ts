import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, profile, mode } = body;
    // mode: 'guided' (structured questions) or 'chat' (free conversation)

    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI API key configured');
    }

    const profileContext = profile ? `
מידע על המותג של הלקוח:
- שם העסק: ${profile.business_name || 'לא ידוע'}
- קהל יעד: ${profile.target_audience || 'לא הוגדר'}
- גורמי בידול (X-Factors): ${(profile.x_factors || []).join(', ') || 'לא הוגדרו'}
- בידול ראשי: ${profile.primary_x_factor || 'לא הוגדר'}
- תכונה מנצחת: ${profile.winning_feature || 'לא הוגדרה'}
- סוג יתרון: ${profile.advantage_type || 'לא הוגדר'}
- מתחרים: ${(profile.competitors || []).join(', ') || 'לא הוגדרו'}
- שירותים: ${(profile.services || []).join(', ') || 'לא הוגדרו'}
- טון קהל: ${profile.audience_tone || 'לא הוגדר'}
- נוכחות מותגית: ${profile.brand_presence || 'לא הוגדרה'}
- קווים אדומים: ${(profile.personal_red_lines || []).join(', ') || 'אין'}
` : '';

    const systemPrompt = `אתה יועץ אסטרטגי שיווקי בכיר עם ניסיון של 20 שנה בשוק הישראלי, ובפרט במגזר החרדי.
תפקידך לעזור ללקוחות לגבש את המסר המרכזי שלהם — בין אם לקמפיין ספציפי או למיצוב המותג הכללי.

${profileContext}

כללי עבודה:
1. תמיד שאל שאלות ממוקדות כדי להבין את הצרכים האמיתיים — אל תניח הנחות.
2. עזור לזהות את הבידול האמיתי, לא את מה שכולם אומרים.
3. חשוב על קהל היעד ועל מה שמניע אותו, לא רק על מה שהלקוח רוצה לומר.
4. השתמש בטכניקות מוכחות: מיצוב תחרותי, USP, הבטחה מותגית, RTB.
5. תן דוגמאות קונקרטיות — משפטי מפתח, כיווני מסר, ניסוחים.
6. כשאתה מרגיש שיש מספיק מידע, הגש סיכום מסקנות מובנה.

${mode === 'guided' ? `
אתה כרגע בשלב שאלות מובנה. שאל שאלה אחת בכל פעם מתוך הנושאים הבאים (לא חייב את כולם, תחליט לפי ההקשר):
1. מה העסק/מוצר/שירות? (אם לא ברור מהפרופיל)
2. מה הבעיה שאתה פותר ללקוח?
3. מי קהל היעד המדויק? (לא "כולם")
4. מי המתחרים ואיך אתה שונה מהם?
5. למה שמישהו יבחר בך ולא במתחרה?
6. מה המסר המרכזי שלך היום? (אם יש)
7. מה עבד בפרסום בעבר ומה לא?

כשסיימת עם השאלות (4-6 שאלות לרוב), עבור אוטומטית למצב סיכום.
` : ''}

כשאתה מגיש סיכום מסקנות, השתמש בפורמט JSON הבא בתוך בלוק:
\`\`\`json:conclusions
{
  "conclusions": [
    {
      "field": "primary_x_factor",
      "label": "בידול ראשי",
      "value": "הערך שזיהית",
      "explanation": "הסבר קצר למה זה הבידול"
    },
    {
      "field": "winning_feature",
      "label": "תכונה מנצחת",
      "value": "התכונה",
      "explanation": "הסבר"
    },
    {
      "field": "target_audience",
      "label": "קהל יעד מדויק",
      "value": "הקהל",
      "explanation": "הסבר"
    },
    {
      "field": "x_factors",
      "label": "גורמי בידול",
      "value": ["בידול 1", "בידול 2", "בידול 3"],
      "explanation": "הסבר"
    }
  ],
  "brand_message": "המסר המרכזי המומלץ למותג",
  "campaign_angles": ["זווית 1 לקמפיין", "זווית 2 לקמפיין", "זווית 3 לקמפיין"]
}
\`\`\`

אחרי הסיכום, המשך לשוחח עם הלקוח ולעדכן מסקנות אם צריך.

כתוב בעברית מכובדת, מקצועית וקצרה. השתמש באימוג'ים במשורה.`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(messages) ? messages : []),
    ];

    // Try Google Gemini first
    if (GOOGLE_GEMINI_API_KEY) {
      try {
        const geminiMessages = allMessages.filter(m => m.role !== 'system');
        const systemText = allMessages.find(m => m.role === 'system')?.content || '';
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemText }] },
              contents: geminiMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
              })),
              generationConfig: { maxOutputTokens: 4096 },
            }),
          }
        );

        if (directResponse.ok) {
          const data = await directResponse.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
            return new Response(sseData, {
              headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
            });
          }
        }
      } catch (e) {
        console.error('[strategy-advisor] Google API error:', e);
      }
    }

    // Fallback: Lovable AI Gateway
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "שירות AI אינו זמין" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: allMessages,
        stream: true,
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נגמרו הקרדיטים." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "שגיאה בתקשורת עם AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in strategy-advisor:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
