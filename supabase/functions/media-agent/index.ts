import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה סוכן המדיה והתקציב של ADKOP, מנהל מדיה (Media Planner) חרדי בכיר עם ניסיון של עשורים. אתה לא רק "קונה שטחי פרסום", אלא אסטרטג של קשב. אתה המוח שמחליט איפה, מתי ואיך יפגוש הלקוח החרדי את המותג.

מנגנון שיקול דעת ואסטרטגיית תקציב:

זמן הקמפיין (Pacing):
- קמפיין קצר (בזק): ריכוז בערוצים עם תגובה מהירה (דיגיטל, וואטסאפ, יומון).
- קמפיין ארוך: פריסה מדורגת, "נוכחות קבועה" לאורך זמן.

סגנון המותג וקהל היעד (Brand Fit):
- התאמה בין "אופי המותג" ל"אופי המדיה". מותג מודרני לא יישלח למדיה שמרנית מדי.

מטרה - מכירתי (Leads) מול תדמיתי (Branding):
- תדמיתי: מגזינים (כרומו), רדיו, חוצות ארציים, יומונים.
- מכירתי/לידים: מקומונים, דיגיטל, אושיות סטטוס, דיוור ישיר.
- משולב: סמכות (עיתון+רדיו) עם הנעה לפעולה (דיגיטל/מקומי).

מקום ועלות (Scope & ROI):
- תקציב קטן: מיקוד גאוגרפי (מקומונים) ודיגיטל לא יקר.
- תקציב גדול: פריסה רחבה כלל הפלטפורמות, אפשרות קד"מ.
- בשורה חדשה: להציע טיזרים.

בניית התמהיל (The ADKOP Strategy) - 3 רבדים:
1. לגיטימציה: עיתונות ארצי וחוצות.
2. מכירה מיידית: מקומונים, דיגיטל, אושיות, ספקי וואטסאפ.
3. חדירה לבית: דיוור ישיר במיילים, מודעות בניינים/בתי כנסת.

פקודת עבודה לסטודיו:
לאחר אישור, הפק פקודה טכנית לכל פריט הכוללת: סוג המודעה, מידות נטו, מידות לבליד, הוראות סגירה.

חשוב: הסתמך אך ורק על מאגר המדיה של המערכת. אל תמציא ערוצי מדיה.

פלט טכני (JSON) - SYSTEM_COMMAND:
- media_plan: [{outlet_name, outlet_id, product_name, product_id, spec_id, price, rationale}]
- total_budget: סה"כ עלות
- budget_breakdown: {legitimacy_pct, direct_sale_pct, home_penetration_pct}
- studio_briefs: [{media_name, ad_type, dimensions, bleed, instructions}]
- pacing_strategy: תזמון הפרסומים
- next_agent: "Super_Agent" (לאישור) או "Studio" (לביצוע)`;

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
    const {
      message,
      superAgentPayload,
      budget,
      targetStream,
      targetGender,
      targetCity,
      campaignGoal,
      campaignDuration,
      conversationHistory,
    } = await req.json();

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

    // Fetch media catalog from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all media data in parallel
    const [categoriesRes, outletsRes, productsRes, specsRes] = await Promise.all([
      supabase.from('media_categories').select('*').order('sort_order'),
      supabase.from('media_outlets').select('*').eq('is_active', true),
      supabase.from('media_products').select('*').eq('is_active', true),
      supabase.from('product_specs').select('*').eq('is_active', true),
    ]);

    // Build media catalog context for the AI
    let mediaCatalog = '\n=== מאגר מדיה (Master Media Catalog) ===\n';

    const categories = categoriesRes.data || [];
    const outlets = outletsRes.data || [];
    const products = productsRes.data || [];
    const specs = specsRes.data || [];

    for (const cat of categories) {
      mediaCatalog += `\n📂 ${cat.name_he} (${cat.name})\n`;
      const catOutlets = outlets.filter(o => o.category_id === cat.id);
      
      for (const outlet of catOutlets) {
        mediaCatalog += `  📰 ${outlet.name_he || outlet.name}`;
        if (outlet.stream) mediaCatalog += ` | זרם: ${outlet.stream}`;
        if (outlet.city) mediaCatalog += ` | עיר: ${outlet.city}`;
        if (outlet.vibe_he) mediaCatalog += ` | וייב: ${outlet.vibe_he}`;
        if (outlet.warning_text) mediaCatalog += ` | ⚠️ ${outlet.warning_text}`;
        if (outlet.reach_info) mediaCatalog += ` | חשיפה: ${outlet.reach_info}`;
        mediaCatalog += ` | ID: ${outlet.id}\n`;

        const outletProducts = products.filter(p => p.outlet_id === outlet.id);
        for (const product of outletProducts) {
          mediaCatalog += `    📋 ${product.name_he || product.name} (${product.product_type})`;
          if (product.gender_target) mediaCatalog += ` | מגדר: ${product.gender_target}`;
          if (product.client_price) mediaCatalog += ` | מחיר: ₪${product.client_price}`;
          mediaCatalog += ` | ID: ${product.id}\n`;

          const productSpecs = specs.filter(s => s.product_id === product.id);
          for (const spec of productSpecs) {
            mediaCatalog += `      📐 ${spec.name_he || spec.name}`;
            if (spec.dimensions) mediaCatalog += ` | מידות: ${spec.dimensions}`;
            if (spec.client_price) mediaCatalog += ` | מחיר: ₪${spec.client_price}`;
            mediaCatalog += ` | ID: ${spec.id}\n`;
          }
        }
      }
    }

    // Build context
    let contextBlock = mediaCatalog;

    if (superAgentPayload) {
      contextBlock += `\n=== הנחיות סוכן-העל ===\n${JSON.stringify(superAgentPayload, null, 2)}\n`;
    }

    contextBlock += `\n=== פרמטרי קמפיין ===\n`;
    if (budget) contextBlock += `תקציב: ₪${budget}\n`;
    if (targetStream) contextBlock += `זרם: ${targetStream}\n`;
    if (targetGender) contextBlock += `מגדר: ${targetGender}\n`;
    if (targetCity) contextBlock += `עיר: ${targetCity}\n`;
    if (campaignGoal) contextBlock += `מטרה: ${campaignGoal}\n`;
    if (campaignDuration) contextBlock += `משך: ${campaignDuration}\n`;

    const messages: Array<{role: string; content: string}> = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock }
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
      const status = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: status === 429 ? 'Rate limit exceeded' : status === 402 ? 'AI credits exhausted' : 'AI processing failed' }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let systemCommand = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { systemCommand = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({
      success: true,
      response: content,
      systemCommand,
      agent: 'media-agent',
      mediaOutletsAvailable: outlets.length,
      productsAvailable: products.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Media Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
