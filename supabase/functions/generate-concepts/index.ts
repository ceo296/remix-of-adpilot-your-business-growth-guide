import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Media type specific instructions
async function fetchSectorBrainFromDB(holidaySeason?: string | null) {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    let holidayExamples: any[] = [];
    if (holidaySeason && holidaySeason !== 'year_round') {
      const { data } = await supabase
        .from('sector_brain_examples')
        .select('name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type')
        .eq('holiday_season', holidaySeason)
        .limit(50);
      holidayExamples = data || [];
    }
    const generalQuery = supabase
      .from('sector_brain_examples')
      .select('name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type')
      .limit(50);
    if (holidaySeason && holidaySeason !== 'year_round') {
      generalQuery.or(`holiday_season.is.null,holiday_season.eq.year_round`);
    }
    const { data: generalData, error } = await generalQuery;
    if (error) return null;
    const allExamples = [...holidayExamples, ...(generalData || [])];
    if (!allExamples.length) return null;
    const grouped: Record<string, typeof allExamples> = {};
    for (const item of allExamples) {
      const zone = item.zone || 'general';
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push(item);
    }
    return { total_examples: allExamples.length, holiday_specific_count: holidayExamples.length, holiday: holidaySeason || null, zones: grouped };
  } catch { return null; }
}

const MEDIA_TYPE_INSTRUCTIONS: Record<string, { name: string; format: string; example: string }> = {
  radio: {
    name: 'רדיו',
    format: 'תסריט ספוט רדיו של 30 שניות עם הנחיות לקריין',
    example: 'תסריט קצר וקליט עם הנחיות להטעמה, קצב ומוזיקה מומלצת'
  },
  ad: {
    name: 'מודעות עיתונות',
    format: 'כותרת + תת-כותרת + גוף טקסט קצר + קריאה לפעולה',
    example: 'טקסט מודעה עם היררכיה ברורה לפרסום בעיתונים ומגזינים'
  },
  banner: {
    name: 'באנר דיגיטלי',
    format: 'כותרת קצרה וקליטה + קריאה לפעולה',
    example: 'טקסט מינימלי ותמציתי שעובד בגדלים קטנים'
  },
  billboard: {
    name: 'שלט חוצות',
    format: 'משפט אחד חזק ובולט + לוגו',
    example: 'מסר קצר שנקרא ב-3 שניות מרכב נוסע'
  },
  social: {
    name: 'סושיאל מדיה',
    format: 'כיתוב לפוסט + האשטגים + קריאה לפעולה',
    example: 'טקסט מעורר עניין שמתאים לוואטסאפ, פייסבוק וניוזלטר'
  },
  all: {
    name: 'קמפיין 360°',
    format: 'מסר מרכזי שמתאים לכל הפלטפורמות',
    example: 'רעיון שיכול להתפרש למודעה, באנר, שלט חוצות ורדיו'
  }
};

const HOLIDAY_LABELS: Record<string, string> = {
  pesach: 'פסח',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  shavuot: 'שבועות',
  lag_baomer: 'ל"ג בעומר',
  tu_bishvat: 'ט"ו בשבט',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  year_round: 'כל השנה',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { profile, mediaType, campaignBrief, holidaySeason } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const mediaInfo = MEDIA_TYPE_INSTRUCTIONS[mediaType || 'ad'];
    const isRadio = mediaType === 'radio';
    const holidayName = holidaySeason && holidaySeason !== 'year_round' ? HOLIDAY_LABELS[holidaySeason] : null;

const systemPrompt = `אתה קריאייטיב דירקטור בכיר במשרד פרסום חרדי מוביל. אתה ידוע בכותרות חזקות, שנונות, עם משחקי מילים חכמים.

כללי ברזל:
- כל כותרת חייבת להיות קצרה, בועטת, בלתי נשכחת — כמו כותרת עיתון שעוצרת אנשים ברחוב
- חפש תמיד משחק מילים, ביטוי מפתיע, טוויסט, או ניגוד מעניין
- תשתמש בביטויים מעולם התורה, הגמרא, ההלכה ותתחבר אליהם בצורה שנונה לעולם הפרסום
- אסור קלישאות גנריות כמו "הכי טוב", "מקצועי ואיכותי", "שירות מעולה" - אלה כותרות עצלניות
- כל קונספט חייב לגרום לקורא לחייך, להתרגש, או לעצור ולקרוא שוב
- שפה תקנית וגבוהה, אבל לא מיושנת — חיה, קצבית, עם אנרגיה

${holidayName ? `
=== הקשר חג: ${holidayName} — חובה לשלב ניואנסים מגזריים! ===
זה לא מספיק לכתוב "לקראת ${holidayName}". חייבים ניואנסים אמיתיים מהחיים החרדיים:

${holidaySeason === 'pesach' ? `פסח — ניואנסים חרדיים ספציפיים לשימוש:
- "לצאת מהמצרים" (מצרים = מיצרים, גבולות) — משחק מילים קלאסי
- "מה נשתנה" — ניתן לעשות טוויסט עם המוצר/שירות
- "בכל דור ודור חייב אדם לראות את עצמו כאילו הוא יצא ממצרים" — חיבור אישי
- "דיינו" — אפשר להשתמש לומר "עד עכשיו הסתפקתם ב... דיינו? לא! מגיע לכם יותר"
- ניקיון פסח, מכירת חמץ, שריפת חמץ, קמחא דפסחא
- "עבדים היינו" — "עבדים היינו לפרסום יקר, עכשיו בני חורין"
- ליל הסדר, 4 כוסות, אפיקומן, הגדה, "מנהג ישראל"
- הגעלת כלים, פסח כשר, מהדרין, "שמורה מכל משמר"
- קניות לחג, בגדי יו"ט, שולחן חג` : ''}
${holidaySeason === 'sukkot' ? `סוכות — ניואנסים:
- "ושמחת בחגך" — שימוש לקמפיינים של שמחה
- אושפיזין, ארבעת המינים, אתרוג מהודר, סכך, נענועים
- "חג האסיף" — אפשר לקשר ל"לאסוף" הזדמנויות/לקוחות
- שמחת בית השואבה, הקפות, חול המועד טיולים` : ''}
${holidaySeason === 'chanukah' ? `חנוכה — ניואנסים:
- "מוסיף והולך" — מושלם לקמפיינים של צמיחה/הנחות גדלות
- "נס גדול היה פה" — טוויסט עם המוצר
- 8 ימים של..., סופגניות, לביבות, חנוכיה, נרות, שמן זית
- "מעט מן האור דוחה הרבה מן החושך" — חיבור למותג שמאיר` : ''}
${holidaySeason === 'purim' ? `פורים — ניואנסים:
- "נהפוך הוא" — מושלם לטוויסט, הפתעות, מבצעים
- משלוח מנות, מתנות לאביונים, מגילה, תחפושות
- "ליהודים היתה אורה ושמחה" — שמחה גדולה
- עד דלא ידע, סעודת פורים, "לרווחה"` : ''}
${holidaySeason === 'rosh_hashana' || holidaySeason === 'yom_kippur' ? `ימים נוראים — ניואנסים:
- "כתיבה וחתימה טובה", "שנה טובה ומתוקה"
- תפוח בדבש, רימון, ראש דג, סימנים
- "המלך בשדה" — חודש אלול, קירבה
- תשובה, תפילה, צדקה — מעבירין את רוע הגזירה
- שופר, סליחות, "מי ייתן ותכתבו"` : ''}
${holidaySeason === 'shavuot' ? `שבועות — ניואנסים:
- "זמן מתן תורתנו", לימוד כל הלילה, מאכלי חלב
- "נעשה ונשמע", חירות אמיתית, הר סיני, מגילת רות` : ''}
${holidaySeason === 'bein_hazmanim' || holidaySeason === 'summer' ? `בין הזמנים/קיץ — ניואנסים:
- יציאה מהכולל/ישיבה, זמן למשפחה
- טיולים כשרים, אטרקציות, בריכות מהודרות
- "בין הזמנים" — ביטוי ייחודי לחרדים, לא "חופש גדול"
- נופש משפחתי, צימרים, "להעלות את הסוללות"` : ''}
=== סוף הקשר חג ===
` : ''}

אתה יוצר קונספטים עבור: ${mediaInfo.name}
פורמט נדרש: ${mediaInfo.format}
דוגמה: ${mediaInfo.example}

CRITICAL — למד מהרפרנסים:
אם מצורפים רפרנסים מ-Sector Brain (דוגמאות מוצלחות), לימד מהם את:
- סגנון הכותרות (האם הם שנוניים? משחקי מילים? ציטוטי חז"ל?)
- רמת היצירתיות (האם יש טוויסט מפתיע? הומור עדין?)
- אורך הטקסט והטון
- השתמש בהם כהשראה, אל תעתיק — תצור משהו חדש באותה רמה

Generate exactly 3 creative concepts for ${isRadio ? 'radio spots' : 'advertising campaigns'}. Each concept should have:
1. A distinct angle (emotional, hard-sale, or pain-point)
2. ${isRadio ? 'A radio script with narration instructions' : 'A visual idea description (what the image should show)'}
3. ${isRadio ? 'The complete radio script in Hebrew (30 seconds)' : 'A short copy/slogan in Hebrew'}
4. HEADLINE — כותרת שנונה, חזקה, עם משחק מילים או טוויסט מפתיע. זה הדבר הכי חשוב!

Respond ONLY with valid JSON in this exact format:
{
  "concepts": [
    {
      "type": "emotional",
      "headline": "כותרת שנונה עם משחק מילים!",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'הקופי בעברית...'}"
    },
    {
      "type": "hard-sale",
      "headline": "כותרת מכירתית עם טוויסט!", 
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'הקופי בעברית...'}"
    },
    {
      "type": "pain-point",
      "headline": "כותרת שפותרת בעיה בצורה חכמה!",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'הקופי בעברית...'}"
    }
  ]
}`;

    // Campaign brief info
    const campaignTitle = campaignBrief?.title || '';
    const campaignOffer = campaignBrief?.offer || '';
    const campaignGoal = campaignBrief?.goal || '';

    const userPrompt = `Create 3 creative ${isRadio ? 'radio spot' : 'advertising'} concepts for this business:

Business Name: ${profile.business_name || 'עסק כללי'}
Target Audience: ${profile.target_audience || 'משפחות חרדיות'}
Main X-Factor/Unique Selling Point: ${profile.primary_x_factor || 'איכות ושירות'}
Winning Feature: ${profile.winning_feature || 'מקצועיות'}
Advantage Type: ${profile.advantage_type || 'שירות'}
All X-Factors: ${profile.x_factors?.join(', ') || 'איכות, מחיר, שירות'}

${campaignTitle || campaignOffer ? `
=== CAMPAIGN BRIEF - CRITICAL ===
${campaignTitle ? `Campaign Name: ${campaignTitle}` : ''}
${campaignOffer ? `MAIN OFFER/MESSAGE (MUST be the central focus of ALL concepts): ${campaignOffer}` : ''}
${campaignGoal ? `Campaign Goal: ${campaignGoal === 'promotion' ? 'Sale/Promotion' : campaignGoal === 'awareness' ? 'Brand Awareness' : campaignGoal === 'launch' ? 'Product Launch' : campaignGoal === 'seasonal' ? 'Seasonal/Holiday Campaign' : campaignGoal}` : ''}

IMPORTANT: The main offer "${campaignOffer}" MUST appear prominently in each concept's copy and be the central message. Do not create generic brand concepts - focus specifically on this offer!
=================================
` : ''}

Media Type: ${mediaInfo.name}
Format: ${mediaInfo.format}

${isRadio ? `
IMPORTANT: For radio spots:
- Write complete 30-second scripts with clear narration text
- Include notes for the narrator (tone, emphasis, pacing)
- Suggest background music style if relevant
- Include a catchy opening and strong call-to-action ending
${campaignOffer ? `- The main message "${campaignOffer}" must be mentioned clearly at least twice in the script` : ''}
` : `
The visual concepts should speak directly to this audience and highlight what makes this business special.
Tailor the text length and style to fit ${mediaInfo.name}.
${campaignOffer ? `CRITICAL: The main offer "${campaignOffer}" must be the central element in the copy and visual description. Every concept must prominently feature this offer!` : ''}
`}
${holidayName ? `
=== HOLIDAY CONTEXT ===
This campaign is for ${holidayName}. Make sure the concepts reflect the atmosphere and themes of ${holidayName}.
Use appropriate symbols, greetings, and messaging for the season.
=======================
` : ''}
Remember: Each concept needs a different angle - one emotional, one hard-sale focused, and one addressing a pain point the audience has.
${campaignOffer ? `But ALL concepts must prominently feature the main offer: "${campaignOffer}"` : ''}`;

    // Fetch sector brain references with holiday awareness
    const sectorBrainData = await fetchSectorBrainFromDB(holidaySeason || null);
    const sectorContext = sectorBrainData 
      ? `\n\n=== רפרנסים מ-Sector Brain (${sectorBrainData.total_examples} דוגמאות, ${sectorBrainData.holiday_specific_count || 0} ספציפיות ל"${holidayName || 'כל השנה'}") ===
למד מהדוגמאות האלה! שים לב לסגנון הכותרות, משחקי המילים, הטוויסטים. העלה את הרמה שלך לפחות לרמה הזאת:
${JSON.stringify(sectorBrainData.zones)}
דוגמאות מ-"hall_of_fame" = השראה חיובית. "red_lines" = מה לא לעשות.
בקמפיין עונתי — תעדיף את הדוגמאות הספציפיות לחג!
=== סוף רפרנסים ===`
      : '';

    console.log('Generating concepts for:', profile.business_name, 'Media type:', mediaType, 'Campaign offer:', campaignBrief?.offer, 'Holiday:', holidayName, 'Sector brain examples:', sectorBrainData?.total_examples || 0);

    // Try primary model, then fallback model
    const modelsToTry = ['google/gemini-2.5-flash', 'openai/gpt-5-mini'];
    let response: Response | null = null;
    
    for (const tryModel of modelsToTry) {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: tryModel,
          messages: [
            { role: 'system', content: systemPrompt + sectorContext },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (response.ok) {
        console.log(`Model ${tryModel} succeeded`);
        break;
      }
      
      console.warn(`Model ${tryModel} returned ${response.status}, trying next...`);
      
      if (response.status === 429 || response.status === 402) break; // Don't retry rate/payment issues
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Instead of throwing, use fallback concepts
      console.warn(`AI Gateway returned ${response.status}, using fallback concepts`);
      const campaignOffer = campaignBrief?.offer || '';
      const fallbackConcepts = {
        concepts: [
          {
            type: 'emotional',
            headline: 'הזווית המרגשת',
            idea: isRadio 
              ? `ספוט רדיו חם ומשפחתי עבור ${profile.business_name || 'העסק'}` 
              : `תמונה חמימה של משפחה נהנית מ${profile.business_name || 'השירות'}`,
            copy: isRadio 
              ? `(קול קריין חם) "${profile.business_name || 'אנחנו'} - כי המשפחה שלכם מגיעה את הכי טוב. ${campaignOffer ? campaignOffer + '.' : ''} התקשרו עכשיו!"` 
              : campaignOffer || 'כי המשפחה שלכם מגיעה את הכי טוב'
          },
          {
            type: 'hard-sale',
            headline: 'הזווית המכירתית',
            idea: isRadio 
              ? `ספוט אנרגטי עם מבצע מיוחד` 
              : `תקריב על המוצר/שירות של ${profile.business_name || 'העסק'} עם רקע יוקרתי`,
            copy: isRadio 
              ? `(קול קריין נמרץ) "מבצע מיוחד ב${profile.business_name || 'העסק'}! ${campaignOffer ? campaignOffer + '!' : 'רק השבוע - מחירים שלא תאמינו!'} התקשרו עכשיו!"` 
              : campaignOffer || 'הזדמנות מיוחדת - למהר לפני שנגמר!'
          },
          {
            type: 'pain-point',
            headline: 'פתרון הבעיה',
            idea: isRadio 
              ? `ספוט שמתחיל מהבעיה ומציע פתרון` 
              : 'אדם רגוע ומחייך אחרי שמצא את הפתרון המושלם',
            copy: isRadio 
              ? `(קול קריין מבין) "נמאס לחפש? ${profile.business_name || 'אנחנו כאן'} - ${campaignOffer || profile.primary_x_factor || 'הפתרון המושלם'}. סוף סוף מישהו שמבין!"` 
              : campaignOffer || `${profile.primary_x_factor || 'השירות המושלם'} - סוף סוף מישהו שמבין`
          }
        ]
      };
      const fallbackWithIds = fallbackConcepts.concepts.map((c: any, i: number) => ({
        ...c,
        id: `${c.type}-${Date.now()}-${i}`,
        mediaType: mediaType || 'ad'
      }));
      return new Response(JSON.stringify({ concepts: fallbackWithIds }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Response:', content);

    // Parse JSON from the response
    let concepts;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        concepts = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return fallback concepts based on media type
      concepts = {
        concepts: [
          {
            type: 'emotional',
            headline: 'הזווית המרגשת',
            idea: isRadio 
              ? `ספוט רדיו חם ומשפחתי עבור ${profile.business_name || 'העסק'}` 
              : `תמונה חמימה של משפחה נהנית מ${profile.business_name || 'השירות'}`,
            copy: isRadio 
              ? `(קול קריין חם) "${profile.business_name || 'אנחנו'} - כי המשפחה שלכם מגיעה את הכי טוב. התקשרו עכשיו!"` 
              : 'כי המשפחה שלכם מגיעה את הכי טוב'
          },
          {
            type: 'hard-sale',
            headline: 'הזווית המכירתית',
            idea: isRadio 
              ? `ספוט אנרגטי עם מבצע מיוחד` 
              : `תקריב על המוצר/שירות של ${profile.business_name || 'העסק'} עם רקע יוקרתי`,
            copy: isRadio 
              ? `(קול קריין נמרץ) "מבצע מיוחד ב${profile.business_name || 'העסק'}! רק השבוע - מחירים שלא תאמינו! התקשרו עכשיו!"` 
              : 'הזדמנות מיוחדת - למהר לפני שנגמר!'
          },
          {
            type: 'pain-point',
            headline: 'פתרון הבעיה',
            idea: isRadio 
              ? `ספוט שמתחיל מהבעיה ומציע פתרון` 
              : 'אדם רגוע ומחייך אחרי שמצא את הפתרון המושלם',
            copy: isRadio 
              ? `(קול קריין מבין) "נמאס לחפש? ${profile.business_name || 'אנחנו כאן'} - ${profile.primary_x_factor || 'הפתרון המושלם'}. סוף סוף מישהו שמבין!"` 
              : `${profile.primary_x_factor || 'השירות המושלם'} - סוף סוף מישהו שמבין`
          }
        ]
      };
    }

    // Add IDs and media type to concepts
    const conceptsWithIds = concepts.concepts.map((c: any, i: number) => ({
      ...c,
      id: `${c.type}-${Date.now()}-${i}`,
      mediaType: mediaType || 'ad'
    }));

    return new Response(JSON.stringify({ concepts: conceptsWithIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-concepts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
