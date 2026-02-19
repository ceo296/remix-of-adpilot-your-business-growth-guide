import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchSectorBrainFromDB(holidaySeason?: string | null) {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Fetch holiday-specific examples first if holiday provided
    let holidayExamples: any[] = [];
    if (holidaySeason && holidaySeason !== 'year_round') {
      const { data } = await supabase
        .from('sector_brain_examples')
        .select('name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type')
        .eq('holiday_season', holidaySeason)
        .limit(50);
      holidayExamples = data || [];
    }

    // Fetch general examples
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
    return {
      total_examples: allExamples.length,
      holiday_specific_count: holidayExamples.length,
      holiday: holidaySeason || null,
      zones: grouped,
      summary: Object.entries(grouped).map(([z, items]) => `${z}: ${items.length} דוגמאות`).join(', '),
    };
  } catch { return null; }
}

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה סוכן AI בכיר המשמש כ־ איש פרסום חרדי וותיק עם ניסיון של מעל 10 שנים.
אתה משמש כ- המבוגר האחראי של מערכת הפרסום החרדית, סדרן תנועה בין סוכנים, כלים ומודלים, וכשומר הסף שמוודא שהמערכת לעולם לא תוציא תחת ידה משהו שלא מתאים למגזר החרדי או נראה לא טוב.

אתה משלב בו־זמנית את התפקידים הבאים:
- מנהל קריאייטיב חרדי
- אסטרטג פרסום
- תקציבאי
- סוכן הסטודיו
- איש שיווק חרדי בקיא ומנוסה
- סמכות ערכית־מגזרית

גבולות אדומים (איסורים מוחלטים):
- אסור לנבל את הפה
- אין שפה רחובית: אין ביטויים צבאיים, סלנג חילוני בוטה
- אסור לומר את שם השם המפורש
- אסור לדבר סרה ברבנים או עולם התורה
- אין להציג נשים או נערות (חריגים בדיגיטל ינוהלו ע"י סוכן סטודיו)
- גברים וילדים תמיד בלבוש צנוע תואם למגזר
- אין לאשר תוכן אנטי חרדי
- אין להציג מכשירים טכנולוגיים לא מסוננים, לבוש לא צנוע, או תרבות פנאי קלוקלת

שפה וטון: קליל, נעים, אנושי, חרדי אותנטי, סמכותי בלי התנשאות.

זרמים:
- ליטאי: רציונלי, אינטלקטואלי, שפה גבוהה. חליפות קצרות, כובעים קנייטש.
- חסידי: רגשי, נאמן לחצרות, יוקרה ומסורת. פאות, חליפות ארוכות, שטריימל.
- ספרדי: חם, משפחתי, מסורת ואמונת חכמים.
- חרדי מודרני: עובד, צורך אינטרנט, מעריך איכות חיים וחדשנות.

מעגל השנה:
- אלול וחגי תשרי: חיזוק, התחדשות, משפחתיות
- אדר: שמחה, משלוחי מנות
- ניסן (פסח): שיא מכירות, התחדשות
- בין הזמנים: נופש, תיירות
- חורף: רישום למוסדות חינוך

פרוטוקול פלט טכני:
בסיום כל הודעה, צרף בלוק JSON בפורמט SYSTEM_COMMAND הכולל:
- current_phase
- next_agent: Creative/Studio/Media/User
- action_type: Approve/Reject/Route
- payload: { target_audience, strategy, creative_direction, visual_guidelines, usp, brief_summary }

ניתוב מסלולי שירות:
- Full Service: אסטרטגיה -> קריאייטיב -> סטודיו -> מדיה
- Production Only: סטודיו -> מדיה
- Media Only: מדיה (בכפוף לאישור ועדת רוחנית)
- Creative Only: אסטרטגיה -> קריאייטיב -> סיום`;

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
    const { message, clientProfile, campaignContext, sectorBrainData: clientSectorData, conversationHistory } = await req.json();
    const detectedHoliday = campaignContext?.timing || campaignContext?.holiday_season || null;
    const sectorBrainData = clientSectorData || await fetchSectorBrainFromDB(detectedHoliday);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try Google Gemini API first, fallback to Lovable Gateway
    let content = '';
    let aiSuccess = false;

    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('Trying Google Gemini API...');
        const geminiMessages = messages.filter(m => m.role !== 'system');
        const systemText = messages.find(m => m.role === 'system')?.content || '';
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemText }] },
              contents: geminiMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
            }),
          }
        );
        if (directResponse.ok) {
          const data = await directResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) aiSuccess = true;
        } else {
          const errText = await directResponse.text();
          console.error('Google API error:', directResponse.status, errText);
        }
      } catch (e) {
        console.error('Google API fetch error:', e);
      }
    }

    if (!aiSuccess && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable Gateway...');
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        const status = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500;
        return new Response(JSON.stringify({ error: status === 429 ? 'Rate limit exceeded' : status === 402 ? 'AI credits exhausted' : 'AI processing failed' }), {
          status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiData = await aiResponse.json();
      content = aiData.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to extract SYSTEM_COMMAND JSON from response
    let systemCommand = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        systemCommand = JSON.parse(jsonMatch[1]);
      } catch { /* ignore parse errors */ }
    }

    return new Response(JSON.stringify({
      success: true,
      response: content,
      systemCommand,
      agent: 'super-agent',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Super Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
