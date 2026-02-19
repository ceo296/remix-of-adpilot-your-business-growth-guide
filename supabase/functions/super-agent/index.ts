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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build context from client profile and campaign
    let contextBlock = '';
    if (clientProfile) {
      contextBlock += `\n=== פרופיל לקוח ===\n`;
      if (clientProfile.business_name) contextBlock += `שם העסק: ${clientProfile.business_name}\n`;
      if (clientProfile.primary_color) contextBlock += `צבע ראשי: ${clientProfile.primary_color}\n`;
      if (clientProfile.secondary_color) contextBlock += `צבע משני: ${clientProfile.secondary_color}\n`;
      if (clientProfile.target_audience) contextBlock += `קהל יעד: ${clientProfile.target_audience}\n`;
      if (clientProfile.x_factors?.length) contextBlock += `גורמי X: ${clientProfile.x_factors.join(', ')}\n`;
      if (clientProfile.primary_x_factor) contextBlock += `X-Factor ראשי: ${clientProfile.primary_x_factor}\n`;
      if (clientProfile.winning_feature) contextBlock += `תכונה מנצחת: ${clientProfile.winning_feature}\n`;
      if (clientProfile.competitors?.length) contextBlock += `מתחרים: ${clientProfile.competitors.join(', ')}\n`;
      if (clientProfile.personal_red_lines?.length) contextBlock += `קווים אדומים: ${clientProfile.personal_red_lines.join(', ')}\n`;
    }

    if (campaignContext) {
      contextBlock += `\n=== הקשר קמפיין ===\n`;
      if (campaignContext.goal) contextBlock += `מטרה: ${campaignContext.goal}\n`;
      if (campaignContext.vibe) contextBlock += `וייב: ${campaignContext.vibe}\n`;
      if (campaignContext.budget) contextBlock += `תקציב: ${campaignContext.budget}\n`;
      if (campaignContext.target_stream) contextBlock += `זרם: ${campaignContext.target_stream}\n`;
      if (campaignContext.target_gender) contextBlock += `מגדר: ${campaignContext.target_gender}\n`;
      if (campaignContext.target_city) contextBlock += `עיר: ${campaignContext.target_city}\n`;
    }

    if (sectorBrainData) {
      contextBlock += `\n=== ידע מגזרי (Sector Brain) ===\n`;
      if (sectorBrainData.holiday) {
        contextBlock += `חג/עונה: ${sectorBrainData.holiday} (${sectorBrainData.holiday_specific_count || 0} דוגמאות ספציפיות לחג)\n`;
        contextBlock += `חשוב: התאם את הקריאייטיב לרוח החג — סמלים, אווירה, ביטויים ומסרים שמתאימים לעונה.\n`;
      }
      contextBlock += JSON.stringify(sectorBrainData.zones) + '\n';
    }

    const fullSystemPrompt = SYSTEM_PROMPT + contextBlock;

    // Build messages array
    const messages: Array<{role: string; content: string}> = [
      { role: 'system', content: fullSystemPrompt }
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
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

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
