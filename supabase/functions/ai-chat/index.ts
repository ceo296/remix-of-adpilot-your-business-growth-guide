import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const { messages, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch sector brain references
    const sectorBrainData = await fetchSectorBrainFromDB();
    console.log('[ai-chat] Sector Brain loaded:', sectorBrainData ? `${sectorBrainData.total_examples} examples, zones: ${Object.keys(sectorBrainData.zones).join(', ')}` : 'NONE');

    // Build concise sector context
    let sectorContext = '';
    if (sectorBrainData) {
      const summaries: string[] = [];
      for (const [zone, items] of Object.entries(sectorBrainData.zones as Record<string, any[]>)) {
        const names = items.slice(0, 10).map((i: any) => `"${i.name}"`).join(', ');
        summaries.push(`[${zone}]: ${names}`);
      }
      sectorContext = `\nרפרנסים מגזריים להתייחסות: ${summaries.join(' | ')}`;
    }

    // Build system prompt based on context
    const systemPrompt = `אתה עוזר AI חכם למערכת פרסום לקהילה החרדית.
תפקידך לעזור בכתיבת טקסטים פרסומיים, סלוגנים, רעיונות לקמפיינים, ועצות שיווק.

הנחיות חשובות:
- כתוב בעברית תקנית ומכובדת
- התאם את הסגנון לקהל היעד החרדי
- הימנע מתוכן לא צנוע או לא מתאים
- היה יצירתי אך מקצועי
- אם מקבל פרטים על עסק, התאם את ההמלצות אליו
- השתמש ברפרנסים מגזריים שצורפו כדי לתת עצות מבוססות על דוגמאות אמיתיות

${context ? `מידע על העסק הנוכחי:\n${JSON.stringify(context, null, 2)}` : ''}${sectorContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "שגיאה בתקשורת עם AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
