import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchAgentPrompt(agentKey: string, fallback: string): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await supabase.from('agent_prompts').select('system_prompt').eq('agent_key', agentKey).maybeSingle();
    if (data?.system_prompt) {
      console.log(`[${agentKey}] Loaded dynamic prompt from DB (${data.system_prompt.length} chars)`);
      return data.system_prompt;
    }
    console.log(`[${agentKey}] No DB prompt found, using fallback`);
    return fallback;
  } catch (e) {
    console.error(`[${agentKey}] Failed to fetch prompt:`, e);
    return fallback;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { brief, businessName, industry, slideCount = 7, theme = 'corporate', profileData } = await req.json();
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) throw new Error('No AI service configured');

    const pd = profileData || {};
    
    const profileContext = `
פרטי העסק הידועים (חובה להשתמש בנתונים אלה בלבד - אסור להמציא פרטים):
- שם העסק: ${pd.businessName || businessName}
- טלפון: ${pd.phone || 'לא סופק'}
- אימייל: ${pd.email || 'לא סופק'}
- כתובת: ${pd.address || 'לא סופק'}
- אתר: ${pd.website || 'לא סופק'}
- שירותים/תחומים: ${pd.services?.join(', ') || pd.xFactors?.join(', ') || 'לא סופק'}
- X-Factors/יתרונות: ${pd.xFactors?.join(', ') || 'לא סופק'}
- קהל יעד: ${pd.targetAudience || 'לא סופק'}
- יתרון מרכזי: ${pd.winningFeature || 'לא סופק'}
- X-Factor ראשי: ${pd.primaryXFactor || 'לא סופק'}
- נכסי אמון/הישגים: ${pd.qualitySignatures?.join(', ') || 'לא סופק'}
- קמפיינים מוצלחים: ${pd.successfulCampaigns?.join(', ') || 'לא סופק'}
- פייסבוק: ${pd.facebook || 'לא סופק'}
- אינסטגרם: ${pd.instagram || 'לא סופק'}
- לינקדאין: ${pd.linkedin || 'לא סופק'}
- שעות פעילות: ${pd.openingHours || 'לא סופק'}
- סניפים: ${pd.branches || 'לא סופק'}
`;

    const themeInstructions: Record<string, string> = {
      minimal: `סגנון מינימלי (Gamma.app style): כותרות קצרות וחדות, הרבה חלל לבן, ללא עודף מידע. כל שקופית מתמקדת ברעיון אחד בלבד. ניסוח מאופק ואלגנטי. טיפוגרפיה דקה ומדויקת.`,
      corporate: `סגנון תאגידי-מקצועי (Beautiful.ai style): מידע מקיף אך מסודר, נתונים ומספרים, שפה עסקית רצינית. הדגש ניסיון, מומחיות ותוצאות מוכחות. layout מובנה עם grid.`,
      creative: `סגנון יצירתי ונועז (Canva style): כותרות פרובוקטיביות ומפתיעות, שפה שיווקית חזקה, ניסוחים לא שגרתיים. שאלות רטוריות ומשפטי תועלת חזקים.`,
    };

    const DEFAULT_SYSTEM_PROMPT = `🚀 אתה "The Visionary Engine" – מנהל אמנותי בסטודיו למיתוג יוקרה.
המטרה: ליצור מצגת "Million Dollar" שמשלבת רגש, עוצמה וניקיון עיצובי קיצוני. בעברית.

═══ הוראת יסוד: סנכרון מגזרי (Haredi Compliance) ═══
אפס נוכחות נשים/בנות. בשימוש בדמויות אנושיות – גברים וילדים (בנים) בלבד.
ודא שהלבוש והסיטואציה מכובדים ותואמים את רוח הלקוח.

═══ סגנון נבחר ═══
${themeInstructions[theme] || themeInstructions.corporate}

═══ ארכיטקטורת שקופיות ═══
1. COVER (חובה, ראשונה): כותרת Hero ענקית + כותרת משנה ברמה גבוהה.
2. ABOUT - "מי אנחנו": 2-3 פסקאות חזקות. שפת מגזין, לא רשימות.
3. VISION - אם הבריף ארוך ועשיר, צור שקופית "חזון וערכים" נפרדת. אם קצר - דלג.
4. SERVICES (דינמי): אם יש פחות מ-4 שירותים: שקופית אחת. אם 4+: פצל לנושאיות.
5. METHODOLOGY - אם הפרסונה מרמזת על מומחיות, הוסף "איך אנחנו עובדים" עם steps.
6. SOCIAL_PROOF - "למה דווקא אנחנו?": כל נכסי האמון. אם 5+ - פצל ל-2 שקופיות.
7. TARGET_AUDIENCE - "למי מתאים": שקופית ייעודית.
8. CTA - "נשמח לשבת לקפה": פרטי קשר מלאים + סיום מקצועי.

כללי ברזל:
- מינימום 5, מקסימום 10 שקופיות.
- שקופית ראשונה = cover, אחרונה = contact/cta.
- כל שקופית חייבת להכיל תוכן (body/bullets/stats/steps) - אסור כותרת בלבד!
- אסור להמציא מספרים, שמות, טלפונים או נתונים שלא סופקו.

═══ שפת המגזין (Editorial Layout) ═══
CRITICAL: אסור להשתמש ברשימות נקודות גנריות ("•" bullets).
כל מידע חייב להיות מוצג כ:
- פסקאות body עשירות (2-3 משפטים) לשקפי about/vision/testimonial
- steps ממוספרים עם כותרת + תיאור לשקפי methodology/process
- stats עם מספר + label לנתונים מדידים
- bullets רק לשקפי services/value_prop/social_proof/target_audience - אבל כל bullet חייב להיות משפט שלם (5-10 מילים), לא מילה אחת!

כותרות: Hero Titles - 2-5 מילים דומיננטיות וחותכות.
גוף טקסט: שפת מגזין עשירה, עד 3 שורות.
White Space is Luxury: שטח ריק = יוקרה וביטחון של המותג.

═══ חופש יצירתי מונחה (Creative Intuition) ═══
לכל שקף, בחר את האימפקט הוויזואלי החזק ביותר:

1. Human Connection: כשהמסר דורש אמון/שירות אישי/רגש.
   → דמויות (גברים/בנים בלבד!) עם עומק שדה (bokeh) ותאורה טבעית.
   
2. Conceptual Objects: כשהמסר דורש איכות/טכנולוגיה/יוקרה חומרית.
   → אובייקטים עוצמתיים, צילומי מאקרו (Macro), סטיילינג מושלם.
   
3. Abstract Atmosphere: כשהמסר תיאורטי או דורש "שקט" עיצובי.
   → טקסטורות, גרדיאנטים עמוקים, אור דרמטי ללא אובייקט ספציפי.

═══ אסטרטגיה ויזואלית מבוססת תחום ═══
• מרפאות שיניים / רפואה: רקעים חמים ומזמינים, חיוכים, אווירה נקייה. אסור כהה/קודר!
• נדל"ן: הדמיות אדריכלות מרשימות. מותר רקעים כהים יוקרתיים. ללא דמויות.
• אוכל/קייטרינג: צילומי מאקרו מעוררי תיאבון, תאורה חמה.
• מקצועות חופשיים: אווירה משרדית, חפצים סימבוליים, גריד מאופק.
• חינוך/גנים: צבעוניות חמה ועליזה, אווירה משפחתית.
• כל תחום אחר: התאם לקהל היעד ולאופי העסק.

תעשיית הלקוח: ${profileData?.industry || 'כללי'}

═══ חוק האחידות הוויזואלית (Design DNA) ═══
1. סגנון רקע אחיד: Dark Mode או Bright & Airy - לא לערבב!
2. שפה צילומית אחידה: אם שקף השער Full-Bleed, שמור על זה.
3. פלטת צבעים: אך ורק צבעי המותג. הצבע הראשי שולט.
4. היררכיה קבועה: כותרות ולוגו במיקום קבוע בכל שקף.

═══ אסטרטגיית טיפוגרפיה (Typography Strategy 2026) ═══

📋 זוגות פונטים מומלצים למצגות:
• יוקרה / Legacy: כותרות ענק ב-Frank Ruhl Libre (700), טקסט ב-Assistant (300). ניגודיות של "מיליון דולר".
• אלגנטי / שמרני: כותרות ב-David Libre (700), טקסט ב-Heebo (400). מראה מכובד.
• מודרני / מינימליסטי: כותרות ב-Alef (700) עם Letter-Spacing גדול (0.15em), טקסט ב-Heebo (300).
${pd.headerFont ? `\n⚡ פונט המותג: כותרות="${pd.headerFont}", גוף="${pd.bodyFont || 'Heebo'}". השתמש בו כברירת מחדל.` : ''}

🔒 חוקי Finishing (בלתי ניתנים לעקיפה):
1. CONTRAST IS KING: לעולם אל תשתמש באותו משקל לכותרת ולטקסט. מינימום 300 הפרש (למשל: 900 vs 400).
2. HAREDI TONE: הטיפוגרפיה חייבת לשדר מכובדות. אסור פונטים ילדותיים או שבורים.
3. HIERARCHY FIRST: גודל ומשקל קובעים חשיבות. כותרת ≥ פי 2.5 מגוף הטקסט.
4. LINE-HEIGHT: בכותרות Hero — צפוף (1.05-1.15). בגוף — מרווח (1.6-1.8) לקריאות.
5. NEGATIVE SPACE: שטח לבן = יוקרה. הגדל כותרת מול טקסט קטן ליצירת עוצמה.

═══ בידוד נכסי לקוח ═══
פונטים פרטיים שהועלו על ידי הלקוח משויכים אליו בלבד. אסור להציע פונט של לקוח X ללקוח Y.

═══ image_prompt (חובה לכל שקופית!) ═══
- פרומפט מפורט באנגלית. תאר: סצנה, תאורה, קומפוזיציה, מצב רוח, צבעים.
- ציין את סוג האינטואיציה שבחרת: "Human Connection:", "Conceptual Objects:", או "Abstract Atmosphere:" בתחילת הפרומפט.
- שמור על אחידות: כל ה-prompts חייבים לשדר אותו עולם ואווירה.
- Cover: תמונה דרמטית שמייצגת את עולם העסק.
- CTA/Contact: תמונה חמה ומזמינה.
- חובה: NO TEXT, NO LETTERS, NO WOMEN, NO GIRLS in image.
- חובה: If humans appear - Haredi Orthodox Jewish men/boys only.
- חובה: Cinematic quality, shallow depth of field, golden hour lighting.

${profileContext}

צור בדיוק ${slideCount} שקופיות (או פחות אם אין מספיק מידע).`;

    // Load dynamic prompt from DB, fall back to hardcoded
    const dbPrompt = await fetchAgentPrompt('generate-presentation', '');
    const systemPrompt = dbPrompt 
      ? dbPrompt + `\n\n═══ סגנון נבחר ═══\n${themeInstructions[theme] || themeInstructions.corporate}\n\n═══ image_prompt (חובה לכל שקופית!) ═══\n- פרומפט מפורט באנגלית. NO TEXT, NO LETTERS, NO WOMEN.\n- Cinematic quality, shallow depth of field, golden hour lighting.\n- If humans appear - Haredi Orthodox Jewish men/boys only.\n\n${profileContext}\n\nצור בדיוק ${slideCount} שקופיות.`
      : DEFAULT_SYSTEM_PROMPT;

    const toolsSchema = [{
      type: "function",
      function: {
        name: "create_presentation",
        description: "Create a Million Dollar business profile presentation with editorial layouts",
        parameters: {
          type: "object",
          properties: {
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["cover", "about", "vision", "services", "value_prop", "stats", "process", "methodology", "testimonial", "social_proof", "target_audience", "team", "cta", "contact"] },
                  title: { type: "string", description: "Hero Title - 2-5 powerful words" },
                  subtitle: { type: "string" },
                  body: { type: "string", description: "Rich editorial paragraph, magazine-style prose" },
                  bullets: { type: "array", items: { type: "string" }, description: "Full sentences (5-10 words each), NOT single words" },
                  stats: { type: "array", items: { type: "object", properties: { value: { type: "string" }, label: { type: "string" } }, required: ["value", "label"] } },
                  steps: { type: "array", items: { type: "object", properties: { number: { type: "string" }, title: { type: "string" }, desc: { type: "string" } }, required: ["number", "title", "desc"] } },
                  image_prompt: { type: "string", description: "Start with 'Human Connection:', 'Conceptual Objects:', or 'Abstract Atmosphere:' then detailed English scene description. NO TEXT, NO LETTERS, NO WOMEN." },
                },
                required: ["type", "title", "image_prompt"],
                additionalProperties: false
              }
            }
          },
          required: ["slides"],
          additionalProperties: false
        }
      }
    }];

    const userMessage = `שם העסק: ${businessName}\nתעשייה: ${industry || 'כללי'}\nסגנון: ${theme}\n\nבריף:\n${brief}`;

    let response: Response | null = null;

    // Try Google Gemini API first (direct, faster)
    if (GOOGLE_GEMINI_API_KEY) {
      console.log('[generate-presentation] Trying Google Gemini API directly...');
      try {
        const geminiBody = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          tools: [{
            functionDeclarations: toolsSchema.map((t: any) => t.function)
          }],
          toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['create_presentation'] } },
          generationConfig: { maxOutputTokens: 8192 },
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
          // Convert Gemini format to OpenAI-compatible format for downstream parsing
          const geminiData = await directResponse.json();
          const candidate = geminiData.candidates?.[0];
          const funcCall = candidate?.content?.parts?.find((p: any) => p.functionCall);
          if (funcCall?.functionCall) {
            // Wrap in OpenAI-compatible format
            const fakeResponse = {
              choices: [{
                message: {
                  tool_calls: [{
                    function: {
                      name: funcCall.functionCall.name,
                      arguments: JSON.stringify(funcCall.functionCall.args),
                    }
                  }]
                }
              }]
            };
            console.log('[generate-presentation] Google Gemini direct success');
            // Create a synthetic Response object
            response = new Response(JSON.stringify(fakeResponse), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } else {
          const errText = await directResponse.text();
          console.error('[generate-presentation] Google API error:', directResponse.status, errText);
        }
      } catch (e) {
        console.error('[generate-presentation] Google API fetch error:', e);
      }
    }

    // Fallback to Lovable Gateway
    if (!response) {
      const gatewayModels = ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash', 'openai/gpt-5-mini'];
      for (const model of gatewayModels) {
        if (!LOVABLE_API_KEY) break;
        console.log(`[generate-presentation] Trying Gateway model: ${model}`);
        try {
          response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
              tools: toolsSchema,
              tool_choice: { type: "function", function: { name: "create_presentation" } },
            }),
          });

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

          if (response.ok) {
            console.log(`[generate-presentation] Gateway success with: ${model}`);
            break;
          }

          const errText = await response.text();
          console.error(`[generate-presentation] Model ${model} failed: ${response.status}`, errText);
          response = null;
          await new Promise(r => setTimeout(r, 1500));
        } catch (fetchErr) {
          console.error(`[generate-presentation] Fetch error for ${model}:`, fetchErr);
          response = null;
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }

    if (!response || !response.ok) {
      throw new Error('שירות ה-AI אינו זמין כרגע. נסה שוב בעוד כמה דקות.');
    }

    const data = await response.json();
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let slides;
    if (toolCall?.function?.arguments) {
      const parsed = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
      slides = parsed.slides;
    } else {
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
