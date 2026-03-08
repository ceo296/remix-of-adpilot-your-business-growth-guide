import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { brief, businessName, industry, slideCount = 7 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = `אתה מעצב מצגות מקצועי ברמה של Gamma / Beautiful.ai.
תפקידך ליצור תוכן מצגת מושלם בעברית על בסיס בריף קצר.

הנחיות:
- כתוב כותרות קצרות ועוצמתיות (3-6 מילים)
- תוכן תמציתי וממוקד - לא יותר מ-3 שורות בגוף טקסט
- bullets קצרים ומדויקים (3-5 מילים לכל אחד)
- שפה שיווקית מקצועית ומשכנעת
- התאם את הטון לתעשייה של העסק
- הקפד על היררכיה ברורה: כותרת > כותרת משנה > תוכן

החזר JSON בפורמט הבא בלבד (ללא markdown, ללא הסברים):
{
  "slides": [
    {
      "type": "cover|about|services|value_prop|stats|process|testimonial|team|cta|contact",
      "title": "כותרת",
      "subtitle": "כותרת משנה (אופציונלי)",
      "body": "גוף טקסט (אופציונלי)",
      "bullets": ["נקודה 1", "נקודה 2"] (אופציונלי),
      "stats": [{"value": "500+", "label": "לקוחות"}] (אופציונלי, עד 4),
      "steps": [{"number": "01", "title": "כותרת", "desc": "תיאור קצר"}] (אופציונלי, עד 4)
    }
  ]
}

סוגי שקופיות אפשריים:
- cover: שער עם כותרת + כותרת משנה
- about: אודות עם body text
- services: שירותים עם bullets (4-6 פריטים)
- value_prop: הצעת ערך עם bullets (3-4 יתרונות)
- stats: נתונים/מספרים עם stats array (3-4 מספרים)
- process: תהליך עבודה עם steps array (3-4 שלבים)
- testimonial: המלצה עם body (ציטוט) + subtitle (שם הממליץ)
- cta: קריאה לפעולה עם title + body
- contact: צור קשר

צור בדיוק ${slideCount} שקופיות. 
השקופית הראשונה חייבת להיות cover והאחרונה contact.
ודא מגוון סוגי שקופיות - אל תחזור על אותו סוג.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `שם העסק: ${businessName}\nתעשייה: ${industry || 'כללי'}\n\nבריף:\n${brief}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_presentation",
            description: "Create a professional presentation with slides",
            parameters: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["cover", "about", "services", "value_prop", "stats", "process", "testimonial", "team", "cta", "contact"] },
                      title: { type: "string" },
                      subtitle: { type: "string" },
                      body: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                      stats: { type: "array", items: { type: "object", properties: { value: { type: "string" }, label: { type: "string" } }, required: ["value", "label"] } },
                      steps: { type: "array", items: { type: "object", properties: { number: { type: "string" }, title: { type: "string" }, desc: { type: "string" } }, required: ["number", "title", "desc"] } },
                    },
                    required: ["type", "title"],
                    additionalProperties: false
                  }
                }
              },
              required: ["slides"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_presentation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'הגעת למגבלת הבקשות. נסה שוב בעוד דקה.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'נדרש חידוש קרדיטים. עבור להגדרות → שימוש.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let slides;
    if (toolCall?.function?.arguments) {
      const parsed = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
      slides = parsed.slides;
    } else {
      // Fallback: try to parse content
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]).slides;
      }
    }

    if (!slides) throw new Error('Failed to parse AI response');

    return new Response(JSON.stringify({ slides }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-presentation error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
