import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { brief, businessName, industry, slideCount = 7, theme = 'corporate', profileData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Build rich context from profile data
    const pd = profileData || {};
    const hasServices = pd.xFactors?.length > 0;
    const hasTrustAssets = pd.qualitySignatures?.length > 0 || pd.successfulCampaigns?.length > 0;
    const hasAddress = !!pd.address;
    const hasSocials = pd.facebook || pd.instagram || pd.linkedin || pd.tiktok || pd.youtube;
    
    const profileContext = `
פרטי העסק הידועים (חובה להשתמש בנתונים אלה בלבד - אסור להמציא פרטים):
- שם העסק: ${pd.businessName || businessName}
- טלפון: ${pd.phone || 'לא סופק'}
- אימייל: ${pd.email || 'לא סופק'}
- כתובת: ${pd.address || 'לא סופק'}
- אתר: ${pd.website || 'לא סופק'}
- שירותים/תחומים: ${pd.xFactors?.join(', ') || 'לא סופק'}
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

    // Dynamic slide logic instructions
    const dynamicLogic = `
לוגיקת בניית שקופיות דינמית (חשוב מאוד!):
ניתח את המידע שקיבלת וצור רצף שקופיות שמרגיש פרימיום.

ארכיטקטורת שקופיות:
1. COVER (חובה, ראשונה): כותרת ויזואלית חזקה + כותרת משנה ברמה גבוהה.
2. ABOUT - "מי אנחנו": סכם את הסיפור ל-2-3 פסקאות חזקות.
3. VISION - אם הבריף ארוך ועשיר, צור שקופית "חזון וערכים" נפרדת. אם קצר - דלג.
4. SERVICES (דינמי):
   - אם יש פחות מ-4 שירותים: שקופית אחת עם כולם.
   - אם יש 4+ שירותים: פצל לשקופיות נושאיות (למשל "שירותי ליבה" + "פתרונות מתקדמים").
5. METHODOLOGY - אם הפרסונה/הבריף מרמזים על מומחיות, הוסף שקופית "איך אנחנו עובדים" עם steps.
6. SOCIAL_PROOF - "למה דווקא אנחנו?": השתמש בכל נכסי האמון. אם יש יותר מ-5 - פצל ל-2 שקופיות.
7. TARGET_AUDIENCE - "למי השירות שלנו מתאים": שקופית ייעודית עם bullets.
8. CTA - "נשמח לשבת לקפה": פרטי קשר מלאים + סיום מקצועי.

כללי ברזל:
- מינימום 5, מקסימום 10 שקופיות - תלוי בעושר המידע.
- שקופית ראשונה = cover, אחרונה = contact.
- אל תחזור על אותו סוג שקופית אלא אם זה מוצדק (למשל 2 services).
- אם אין מידע לשקופית - אל תיצור אותה. עדיף פחות ומדויק.
- אסור להמציא מספרים, שמות, טלפונים או נתונים שלא סופקו.
`;

    const systemPrompt = `אתה Senior Presentation Architect ברמה של Gamma.app / Clean Modernism.
תפקידך ליצור Business Profile מקצועי ברמה הגבוהה ביותר בעברית.

${themeInstructions[theme] || themeInstructions.corporate}

${dynamicLogic}

הנחיות נוספות:
- כותרות: 3-6 מילים, עוצמתיות ומדויקות
- גוף טקסט: תמציתי, עד 3 שורות
- bullets: 3-6 מילים לכל פריט
- נתונים (stats): רק אם סופקו בבריף. אם אין - אל תמציא.
- שפה שיווקית מקצועית ופרימיום
${profileContext}

צור בדיוק ${slideCount} שקופיות (או פחות אם אין מספיק מידע).`;

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
          { role: 'user', content: `שם העסק: ${businessName}\nתעשייה: ${industry || 'כללי'}\nסגנון: ${theme}\n\nבריף:\n${brief}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_presentation",
            description: "Create a professional business profile presentation with dynamic slides",
            parameters: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["cover", "about", "vision", "services", "value_prop", "stats", "process", "methodology", "testimonial", "social_proof", "target_audience", "team", "cta", "contact"] },
                      title: { type: "string" },
                      subtitle: { type: "string" },
                      body: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                      stats: { type: "array", items: { type: "object", properties: { value: { type: "string" }, label: { type: "string" } }, required: ["value", "label"] } },
                      steps: { type: "array", items: { type: "object", properties: { number: { type: "string" }, title: { type: "string" }, desc: { type: "string" } }, required: ["number", "title", "desc"] } },
                      image_prompt: { type: "string", description: "A detailed English prompt to generate a professional, relevant background image for this slide using AI image generation. Describe the visual scene, mood, colors, and composition. Must be photorealistic and business-appropriate. Example: 'Modern bright office space with glass walls, warm golden sunlight, soft bokeh, professional atmosphere'" },
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
