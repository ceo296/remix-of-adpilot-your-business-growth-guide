import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchSectorBrainReferences(supabase: any, mediaTypes: string[], topicCategory?: string, limit = 8): Promise<string> {
  // Fetch relevant text examples from sector brain
  let query = supabase
    .from('sector_brain_examples')
    .select('name, text_content, media_type, topic_category, example_type')
    .eq('is_general_guideline', false)
    .eq('example_type', 'good')
    .not('text_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mediaTypes.length > 0) {
    query = query.in('media_type', mediaTypes);
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    console.log('No sector brain references found:', error?.message);
    return '';
  }

  // If we have a topic, prioritize matching topic but include others too
  let sorted = data;
  if (topicCategory) {
    sorted = [
      ...data.filter((d: any) => d.topic_category === topicCategory),
      ...data.filter((d: any) => d.topic_category !== topicCategory),
    ].slice(0, limit);
  }

  const refs = sorted
    .filter((d: any) => d.text_content?.trim())
    .map((d: any, i: number) => `--- דוגמה ${i + 1} (${d.name}) ---\n${d.text_content.substring(0, 800)}`)
    .join('\n\n');

  return refs;
}

async function fetchSectorGuidelines(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('sector_brain_examples')
    .select('text_content')
    .eq('is_general_guideline', true)
    .not('text_content', 'is', null)
    .limit(5);

  if (!data?.length) return '';
  return data.map((d: any) => d.text_content).join('\n');
}

async function fetchSectorInsights(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('sector_brain_insights')
    .select('content, insight_type')
    .eq('is_active', true)
    .limit(5);

  if (!data?.length) return '';
  return data.map((d: any) => d.content).join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { type, profileData, extraContext } = await req.json();
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) throw new Error('No AI service configured');

    // Initialize Supabase for fetching sector brain data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    // Sector brain context - fetched for ALL material types
    let sectorContext = '';
    const mediaTypeMap: Record<string, string[]> = {
      'greeting': ['greeting', 'copy', 'ad_copy'],
      'article': ['article', 'copy', 'ad_copy', 'strategy'],
      'email': ['email', 'copy', 'ad_copy'],
      'whatsapp': ['whatsapp', 'copy', 'ad_copy'],
      'business-card': ['copy', 'ad_copy', 'strategy'],
      'letterhead': ['copy', 'ad_copy', 'strategy'],
    };
    
    {
      const [references, guidelines, insights] = await Promise.all([
        fetchSectorBrainReferences(
          supabase,
          mediaTypeMap[type] || ['copy', 'ad_copy'],
          pd.topicCategory,
          6
        ),
        fetchSectorGuidelines(supabase),
        fetchSectorInsights(supabase),
      ]);

      const parts: string[] = [];
      if (guidelines) {
        parts.push(`## הנחיות כלליות מהמוח הסקטוריאלי\n${guidelines}`);
      }
      if (insights) {
        parts.push(`## תובנות סקטוריאליות (כללי אצבע שהופקו מדוגמאות מוצלחות)\n${insights}`);
      }
      if (references) {
        parts.push(`## דוגמאות מוצלחות שכבר פורסמו במגזר (השתמש בסגנון, במבנה ובטון שלהן כהשראה)\n${references}`);
      }
if (parts.length > 0) {
        sectorContext = `\n\n🧠 מידע סקטוריאלי — חרדי (חובה להיצמד לסגנון, לטון ולכללים הבאים):\n${parts.join('\n\n')}\n\n🛡️ פרוטוקול מקוריות:\n- למד מהרפרנסים הכל: מילים, ביטויים, קומפוזיציה, מבנה, טון, מקצב, אווירה.\n- ספוג את אוצר המילים הסקטוריאלי — זה הסגנון שלך.\n- אבל: אסור בהחלט להעתיק משפט שלם, פסקה, או מבנה קומפוזיציה אחד-לאחד.\n- פרק כל דוגמה לגורמים ("ניגודיות חזקה", "שאלה רטורית", "טוויסט תלמודי") → הרכב מחדש בצורה מקורית.\n- המטרה: תוצר שמרגיש כאילו נכתב ע"י אותו עולם — אבל חדש לגמרי.`;
      }
    }

    const harediBrief = `
כללי חרדיות חובה:
- שפה מכבדת, ללא סלנג חילוני
- פנייה בלשון כבוד (רבים/יחיד בהתאם לקהל)
- אין הפניה ישירה לנשים בפרסום לגברים ולהיפך
- חגים ומועדים — יש להשתמש בנוסח המסורתי ("חג שמח", "שנה טובה ומתוקה")
- אסור: תוכן פרובוקטיבי, הומור לא צנוע, הבטחות מופרזות
- מותר: משחקי מילים, הומור עדין, ציטוטי חז"ל במינון
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
      systemPrompt = `אתה כותב ברכות מקצועיות בעברית עבור עסקים במגזר החרדי. צור ברכה ממותגת ל${occasionMap[greetingOccasion] || 'אירוע'}.
${profileBlock}
${recipientName ? `הנמען: ${recipientName}` : 'ברכה כללית ללקוחות/שותפים'}
${harediBrief}
${sectorContext}
הנחיות:
- כתוב בשפה חמה ומכבדת — בסגנון המגזר החרדי
- הברכה צריכה לשלב את שם העסק בצורה טבעית
- טון: חגיגי, אישי, מקצועי
- אורך: 2-4 משפטים — לא ארוך מדי
- כותרת קצרה וקולעת (2-4 מילים)
- אם זה חג — התייחס למהות החג בנוסח המסורתי
- אם זו חתונה/בר מצווה — ברכה מרגשת ואישית
- השתמש בדוגמאות המוצלחות למעלה כהשראה לסגנון ולמבנה
${extraContext?.userPrompt ? `- הנחיות נוספות מהמשתמש (חובה ליישם): ${extraContext.userPrompt}` : ''}`;
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
${harediBrief}
${sectorContext}
הנחיות:
- כתוב בסגנון עיתונאי-שיווקי (advertorial) — נקרא כמו כתבה אבל משווק את העסק
- כותרת מושכת עם הוק חזק — למד מהדוגמאות המוצלחות למעלה
- כותרת משנה שמרחיבה
- פסקאות קצרות וברורות
- ציטוט אחד לפחות (מבעל העסק או לקוח)
- לא "מודעתי" מדי — צריך להרגיש כמו תוכן עיתונאי
- CTA עדין בסוף — לא מכירתי אגרסיבי
- אל תמציא פרטים שלא סופקו
- היצמד לסגנון, לטון ולמבנה של הדוגמאות שפורסמו בהצלחה במגזר
${extraContext?.userPrompt ? `- הנחיות נוספות מהמשתמש (חובה ליישם): ${extraContext.userPrompt}` : ''}`;
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
          }
        }
      };
    } else if (type === 'email') {
      const emailTopic = extraContext?.emailTopic || '';
      toolName = 'generate_email_content';
      systemPrompt = `אתה כותב מיילים שיווקיים מקצועיים בעברית למגזר החרדי. צור מייל דיוור אלקטרוני מעוצב.
${profileBlock}
${emailTopic ? `נושא/הצעה: ${emailTopic}` : ''}
${harediBrief}
${sectorContext}
הנחיות:
- כתוב נושא (subject) קצר, קולע ומזמין פתיחה (עד 8 מילים)
- גוף המייל: 3-5 פסקאות קצרות, שפה חמה ומקצועית
- CTA ברור — כפתור עם טקסט קצר (3-5 מילים)
- אל תמציא מידע שלא סופק
- אסור: סלנג, הבטחות מופרזות, אנגלית`;
      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: "Generate professional marketing email",
          parameters: {
            type: "object",
            properties: {
              subject: { type: "string", description: "נושא המייל" },
              body: { type: "string", description: "גוף המייל" },
              cta: { type: "string", description: "טקסט כפתור הפעולה" },
            },
            required: ["subject", "body", "cta"],
          }
        }
      };
    } else if (type === 'whatsapp') {
      const whatsappTopic = extraContext?.whatsappTopic || '';
      const whatsappSubType = extraContext?.whatsappSubType || 'distribution';
      const isStatus = whatsappSubType === 'status';
      toolName = 'generate_whatsapp_content';
      
      if (isStatus) {
        // STATUS: vertical image (9:16) with minimal text + one short caption
        systemPrompt = `אתה כותב מסרי סטטוס וואטסאפ שיווקיים בעברית למגזר החרדי.

פרסום סטטוס בוואטסאפ = תמונה אנכית (9:16) עם מינימום טקסט + משפט קצר אחד נלווה.

${profileBlock}
${whatsappTopic ? `נושא/הצעה: ${whatsappTopic}` : ''}
${harediBrief}
${sectorContext}
הנחיות לתמונה (imageHeadline + imageSubtext):
- כותרת קצרה מאוד — 3-5 מילים בלבד
- טקסט משני אופציונלי (מחיר / מבצע)
- התמונה צריכה להיות דרמטית, מלאה, ויזואלית — כי זה סטטוס!

הנחיות למשפט הנלווה (message):
- משפט אחד בלבד! קצר וקולע, עם 1-2 אימוג'ים מקסימום
- למשל: "🔥 ההצעה שחיכיתם לה!" או "✨ חדש אצלנו — בואו לגלות"
- אסור טקסט ארוך — זה סטטוס, לא הפצה!`;
      } else {
        // DISTRIBUTION: square image (1:1) with minimal text + storytelling accompanying text
        systemPrompt = `אתה כותב מסרי הפצת וואטסאפ שיווקיים בעברית למגזר החרדי. צור מסר מובנה שמתאים לשיתוף בוואטסאפ.

פרסום הפצה בוואטסאפ מורכב מ-2 חלקים:
1. **קוביה עיצובית** (תמונה מרובעת 1:1) — עם מינימום טקסט! רק כותרת קצרה ובולטת + לוגו + אולי מחיר/מבצע. בלי פסקאות ארוכות בתמונה! הקוביה צריכה להיות נגזרת של הבריף ושל הלקוח (צבעים, שפה, סגנון).
2. **טקסט נלווה** — מסר שיווקי סיפורי שמלווה את התמונה.

**סגנון הטקסט הנלווה — סיפורי-שיווקי:**
הטקסט צריך לשלב טקסטים מודגשים (בין כוכביות **) עם פסקאות רגילות. הנה המבנה:
- פתיחה עם סיפור אישי או תרחיש מזוהה ("לפני כמה חודשים הכרנו את שמואל...")
- ציטוט מודגש מהלקוח/מצב (בין גרשיים, מודגש)
- מעבר לפתרון — מה העסק עושה ולמה זה שונה
- **טקסטים מודגשים** בנקודות מפתח לתפוס תשומת לב
- סיום רגשי/מעורר פעולה
- CTA ברור עם כפתור/קישור
- פרטי קשר בסוף

**כללים חשובים:**
- לא חייב להיות ארוך! יכול להיות קצר וקולע או ארוך וסיפורי — תלוי בתוכן
- להשתמש ב-**טקסט מודגש** לשורות מפתח
- אימוג'ים במינון סביר ובטעם טוב (לא בכל שורה!)
- אסור: סלנג, הבטחות מופרזות, יותר מדי אימוג'ים
- הטקסט צריך להרגיש אותנטי ולא "ספאמי"

${profileBlock}
${whatsappTopic ? `נושא/הצעה: ${whatsappTopic}` : ''}
${harediBrief}
${sectorContext}
הנחיות לקוביה העיצובית (imageHeadline + imageSubtext):
- כותרת קצרה וחזקה בלבד (3-6 מילים)
- טקסט משני אופציונלי קצר מאוד (מחיר, תאריך, מבצע)
- אסור טקסט ארוך בתמונה — התמונה צריכה להיות ויזואלית ונקייה`;
      }

      toolDef = {
        type: "function",
        function: {
          name: toolName,
          description: isStatus ? "Generate WhatsApp status content" : "Generate structured WhatsApp distribution content",
          parameters: {
            type: "object",
            properties: {
              imageHeadline: { type: "string", description: "כותרת קצרה לתמונה (3-6 מילים)" },
              imageSubtext: { type: "string", description: "טקסט משני קצר (מחיר/מבצע, אופציונלי)" },
              message: { type: "string", description: isStatus ? "משפט קצר אחד נלווה לסטטוס" : "הטקסט הנלווה המלא שמלווה את התמונה, כולל אימוג'ים ופרטי קשר" },
            },
            required: ["imageHeadline", "message"],
          }
        }
      };
    } else {
      throw new Error(`Unknown material type: ${type}`);
    }

    const userContent = `צור תוכן מקצועי עבור ${businessName}. ${extraContext?.userPrompt || ''}`;
    let data: any = null;

    // Try Google Gemini API first (direct, faster)
    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('[generate-internal-material] Trying Google Gemini API...');
        const geminiBody = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          tools: [{
            functionDeclarations: [toolDef.function]
          }],
          toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [toolName] } },
          generationConfig: { maxOutputTokens: 4096 },
        };
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
          }
        );
        if (directResponse.ok) {
          const geminiData = await directResponse.json();
          const funcCall = geminiData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
          if (funcCall?.functionCall) {
            data = {
              choices: [{
                message: {
                  tool_calls: [{
                    function: {
                      name: funcCall.functionCall.name,
                      arguments: funcCall.functionCall.args,
                    }
                  }]
                }
              }]
            };
            console.log('[generate-internal-material] Google Gemini direct success');
          }
        } else {
          const errText = await directResponse.text();
          console.error('[generate-internal-material] Google API error:', directResponse.status, errText);
        }
      } catch (e) {
        console.error('[generate-internal-material] Google API fetch error:', e);
      }
    }

    // Fallback to Lovable Gateway
    if (!data && LOVABLE_API_KEY) {
      console.log('[generate-internal-material] Falling back to Lovable Gateway...');
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
            { role: 'user', content: userContent },
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

      data = await response.json();
    }

    if (!data) throw new Error('No AI response received');

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
