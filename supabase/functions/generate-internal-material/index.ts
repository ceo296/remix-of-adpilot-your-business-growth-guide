import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { type, profileData, extraContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const pd = profileData || {};
    const businessName = pd.businessName || 'העסק';

    const profileBlock = `
פרטי העסק (חובה להשתמש בנתונים אלה בלבד - אסור להמציא):
- שם העסק: ${businessName}
- טלפון: ${pd.phone || 'לא סופק'}
- אימייל: ${pd.email || 'לא סופק'}
- כתובת: ${pd.address || 'לא סופק'}
- אתר: ${pd.website || 'לא סופק'}
- שירותים: ${pd.xFactors?.join(', ') || 'לא סופק'}
- קהל יעד: ${pd.targetAudience || 'לא סופק'}
- יתרון מרכזי: ${pd.winningFeature || 'לא סופק'}
- שעות פעילות: ${pd.openingHours || 'לא סופק'}
`;

    let systemPrompt = '';
    let toolDef: any = null;
    let toolName = '';

    if (type === 'business-card') {
      toolName = 'generate_card_content';
      systemPrompt = `אתה מעצב כרטיסי ביקור מקצועי. צור תוכן מדויק לכרטיס ביקור בעברית.
${profileBlock}
הנחיות:
- title: תפקיד מקצועי מתאים לתחום (3 מילים מקסימום)
- tagline: משפט שיווקי קצר וחד (4-6 מילים)
- אל תמציא מידע שלא סופק`;
      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate professional business card content",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "תפקיד מקצועי" },
              tagline: { type: "string", description: "משפט שיווקי קצר" },
            },
            required: ["title", "tagline"],
            additionalProperties: false
          }
        }
      };
    } else if (type === 'letterhead') {
      const letterType = extraContext?.letterType || 'general';
      const recipientName = extraContext?.recipientName || '';
      const letterTopic = extraContext?.letterTopic || '';
      
      const letterTypeMap: Record<string, string> = {
        'price-quote': 'הצעת מחיר מקצועית',
        'formal-letter': 'מכתב רשמי',
        'thank-you': 'מכתב תודה',
        'invitation': 'הזמנה לאירוע',
        'general': 'מכתב עסקי כללי',
      };

      toolName = 'generate_letter_content';
      systemPrompt = `אתה כותב מכתבים עסקיים מקצועי בעברית. צור ${letterTypeMap[letterType] || 'מכתב עסקי'}.
${profileBlock}
${recipientName ? `הנמען: ${recipientName}` : ''}
${letterTopic ? `נושא: ${letterTopic}` : ''}
הנחיות:
- כתוב בשפה עברית עסקית-מקצועית
- הפנייה מתאימה לסוג המכתב
- חתימה מקצועית
- אורך: 3-6 פסקאות`;
      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate professional letter content in Hebrew",
          parameters: {
            type: "object",
            properties: {
              subtitle: { type: "string", description: "כותרת משנה לנייר מכתבים" },
              recipientName: { type: "string", description: "שם הנמען" },
              recipientTitle: { type: "string", description: "תפקיד הנמען" },
              letterContent: { type: "string", description: "גוף המכתב המלא" },
              senderName: { type: "string", description: "שם החותם" },
              senderTitle: { type: "string", description: "תפקיד החותם" },
            },
            required: ["letterContent", "senderName", "senderTitle"],
            additionalProperties: false
          }
        }
      };
    } else if (type === 'catalog') {
      const productCount = extraContext?.productCount || 6;
      const catalogTopic = extraContext?.catalogTopic || '';

      toolName = 'generate_catalog_content';
      systemPrompt = `אתה יוצר תוכן קטלוגי מקצועי בעברית לעסק.
${profileBlock}
${catalogTopic ? `נושא הקטלוג: ${catalogTopic}` : ''}
הנחיות:
- צור שמות מוצרים/שירותים ריאליסטיים בהתאם לתחום העסק
- תיאורים קצרים ושיווקיים (עד 15 מילים)
- מחירים סבירים בשקלים
- badges רלוונטיים (חדש, מבצע, חם, נבחר)
- כותרת קאבר וכותרת משנה מושכים
- טקסט "הסיפור שלנו" של 2-3 משפטים`;
      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate professional catalog content",
          parameters: {
            type: "object",
            properties: {
              coverTitle: { type: "string" },
              coverSubtitle: { type: "string" },
              storyText: { type: "string", description: "טקסט 'הסיפור שלנו'" },
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    price: { type: "string" },
                    badge: { type: "string" },
                  },
                  required: ["name", "description", "price"],
                  additionalProperties: false
                }
              }
            },
            required: ["coverTitle", "coverSubtitle", "products"],
            additionalProperties: false
          }
        }
      };
    } else if (type === 'greeting') {
      const greetingOccasion = extraContext?.occasion || 'general';
      const recipientName = extraContext?.recipientName || '';
      
      const occasionMap: Record<string, string> = {
        'rosh-hashana': 'ראש השנה — שנה טובה ומתוקה',
        'sukkot': 'סוכות — חג סוכות שמח',
        'chanukah': 'חנוכה — חג אורים שמח',
        'purim': 'פורים — פורים שמח',
        'pesach': 'פסח — חג פסח כשר ושמח',
        'shavuot': 'שבועות — חג שבועות שמח',
        'wedding': 'חתונה — מזל טוב',
        'bar-mitzvah': 'בר מצווה — מזל טוב',
        'birthday': 'יום הולדת — יום הולדת שמח',
        'general': 'ברכה כללית',
      };

      toolName = 'generate_greeting_content';
      systemPrompt = `אתה כותב ברכות מקצועיות בעברית עבור עסקים. צור ברכה ממותגת ל${occasionMap[greetingOccasion] || 'אירוע'}.
${profileBlock}
${recipientName ? `הנמען: ${recipientName}` : 'ברכה כללית ללקוחות/שותפים'}
הנחיות:
- כתוב בשפה חמה ומכבדת
- הברכה צריכה לשלב את שם העסק בצורה טבעית
- טון: חגיגי, אישי, מקצועי
- אורך: 2-4 משפטים — לא ארוך מדי
- כותרת קצרה וקולעת (2-4 מילים)
- אם זה חג — התייחס למהות החג
- אם זו חתונה/בר מצווה — ברכה מרגשת ואישית`;
      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate professional branded greeting",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string", description: "כותרת הברכה (2-4 מילים)" },
              greetingText: { type: "string", description: "טקסט הברכה המלא" },
              closingLine: { type: "string", description: "שורת סיום/חתימה" },
            },
            required: ["headline", "greetingText", "closingLine"],
            additionalProperties: false
          }
        }
      };
    } else if (type === 'article') {
      const articleStyle = extraContext?.articleStyle || 'product';
      const articleTopic = extraContext?.articleTopic || '';
      const targetLength = extraContext?.targetLength || 'medium';
      
      const styleMap: Record<string, string> = {
        'product': 'כתבת מוצר/שירות — מציגה יתרונות, תועלות ופרטים',
        'story': 'כתבת סיפור — מספרת את סיפור העסק/היזם בצורה מעניינת',
        'expert': 'כתבת מומחה — מאמר מקצועי שמבסס סמכות בתחום',
        'seasonal': 'כתבה עונתית — תוכן מותאם לעונה או חג',
      };
      const lengthMap: Record<string, string> = {
        'short': '200-300 מילים',
        'medium': '400-600 מילים',
        'long': '700-1000 מילים',
      };

      toolName = 'generate_article_content';
      systemPrompt = `אתה כתב תוכן שיווקי מקצועי בעברית למגזר החרדי. צור ${styleMap[articleStyle] || 'כתבה'}.
${profileBlock}
${articleTopic ? `נושא הכתבה: ${articleTopic}` : ''}
אורך מבוקש: ${lengthMap[targetLength] || '400-600 מילים'}
הנחיות:
- כתוב בסגנון עיתונאי-שיווקי (advertorial) — נקרא כמו כתבה אבל משווק את העסק
- כותרת מושכת עם הוק חזק
- כותרת משנה שמרחיבה
- פסקאות קצרות וברורות
- ציטוט אחד לפחות (מבעל העסק או לקוח)
- לא "מודעתי" מדי — צריך להרגיש כמו תוכן עיתונאי
- CTA עדין בסוף — לא מכירתי אגרסיבי
- אל תמציא פרטים שלא סופקו`;
      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate professional advertorial article",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string", description: "כותרת ראשית" },
              subheadline: { type: "string", description: "כותרת משנה" },
              body: { type: "string", description: "גוף הכתבה המלא" },
              pullQuote: { type: "string", description: "ציטוט מרכזי" },
              callToAction: { type: "string", description: "קריאה לפעולה עדינה" },
            },
            required: ["headline", "subheadline", "body", "pullQuote", "callToAction"],
            additionalProperties: false
          }
        }
      };
    } else {
      throw new Error(`Unknown material type: ${type}`);
    }

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
          { role: 'user', content: `צור תוכן מקצועי עבור ${businessName}. ${extraContext?.userPrompt || ''}` },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'הגעת למגבלת הבקשות. נסה שוב בעוד דקה.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'נדרש חידוש קרדיטים.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    
    if (toolCall?.function?.arguments) {
      result = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    }

    if (!result) throw new Error('Failed to parse AI response');

    return new Response(JSON.stringify({ result, type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-internal-material error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
