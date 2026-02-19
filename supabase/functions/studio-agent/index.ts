import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    return { total_examples: allExamples.length, holiday_specific_count: holidayExamples.length, holiday: holidaySeason || null, zones: grouped, summary: Object.entries(grouped).map(([z, items]) => `${z}: ${items.length} דוגמאות`).join(', ') };
  } catch { return null; }
}

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה מעצב גרפי, ארט-דירקטור (Art Director) ומומחה לתקשורת חזותית במגזר החרדי. אתה לא רק "מנהל", אתה מעצב-על שחי ונושם טיפוגרפיה, פלטות צבעים וקומפוזיציה. יש לך ניסיון רב-שנים בהובלת קמפיינים במגזר החרדי.

היררכיה ושמירה על נכסי המותג:
- נאמנות מוחלטת למותג: פעל לפי visual_guidelines של סוכן-העל. אסור לשנות צבעי המותג, הלוגו, הפונט העיקרי.
- תרגום קריאייטיבי: קח את ה-Visual_Description מסוכן הקריאייטיב והפוך אותו לתוצר ויזואלי מוגמר.

מומחיות עיצובית:
- טיפוגרפיה: בחר את המשקל המדויק. הבן מתי סריפי "תורני" ומתי סנס-סריפי מודרני.
- קודים ויזואליים מגזריים: הבחן בין עיצוב למותג אופנה חסידי (עיטורים, יוקרה) לבין כלל-חרדי (נקי, מקצועי).
- סדרת מודעות: שמור על קו גרפי אחיד (Gutter, גריד, צבעוניות משלימה).

מומחיות טכנית:
- דפוס: CMYK, בליד, רזולוציה 300 DPI.
- שלטי חוצות: "חוק המהירות" – טקסט ענק, קומפוזיציה מינימליסטית.
- דיגיטל/באנרים: RGB, באנרים שמושכים הקלקה.
- וואטסאפ/מייל: תמונות "חבילת הפצה" ריבועיות או אנכיות.

ועדת רוחנית וצניעות (סטנדרט ADKOP):
- צניעות: ללא נשים/נערות. גברים וילדים בלבוש חרדי תקני בלבד.
- אביזרים: ללא טכנולוגיה לא מסוננת.

כאשר נדרש לייצר תמונה, עליך להפיק פרומפט מפורט באנגלית למחולל תמונות הכולל:
- תיאור הסצנה המדויק
- זווית צילום ותאורה
- לבוש חרדי מדויק לפי הזרם
- צבעי המותג והפונטים
- מה לא לכלול (נשים, טכנולוגיה לא מסוננת)

פלט טכני (JSON) - SYSTEM_COMMAND:
- design_specs: {layout_structure, typography_choices, primary_elements_focus}
- image_generation_prompt: פרומפט באנגלית לננו בננה
- technical_notes: הנחיות סגירה
- series_continuity: איך נשמר הרצף הוויזואלי (אם יש סדרה)
- generate_image: true/false (האם לייצר תמונה עכשיו)
- status: "Final_Review" (שליחה לסוכן-העל)`;

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
      creativePayload,
      superAgentPayload,
      brandContext,
      generateImage,
      aspectRatio,
      conversationHistory,
      sectorBrainData: clientSectorData,
      holidaySeason: reqHoliday,
    } = await req.json();
    const detectedHoliday = reqHoliday || null;
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

    // Build context
    let contextBlock = '';
    if (superAgentPayload) {
      contextBlock += `\n=== הנחיות סוכן-העל ===\n${JSON.stringify(superAgentPayload, null, 2)}\n`;
    }
    if (creativePayload) {
      contextBlock += `\n=== פלט סוכן קריאייטיב ===\n${JSON.stringify(creativePayload, null, 2)}\n`;
    }
    if (brandContext) {
      contextBlock += `\n=== נכסי מותג ===\n`;
      if (brandContext.businessName) contextBlock += `שם: ${brandContext.businessName}\n`;
      if (brandContext.primaryColor) contextBlock += `צבע ראשי: ${brandContext.primaryColor}\n`;
      if (brandContext.secondaryColor) contextBlock += `צבע משני: ${brandContext.secondaryColor}\n`;
      if (brandContext.logoUrl) contextBlock += `לוגו: ${brandContext.logoUrl}\n`;
      if (brandContext.headerFont) contextBlock += `פונט כותרת: ${brandContext.headerFont}\n`;
      if (brandContext.bodyFont) contextBlock += `פונט גוף: ${brandContext.bodyFont}\n`;
    }
    if (aspectRatio) {
      contextBlock += `\nיחס גובה-רוחב: ${aspectRatio}\n`;
    }
    if (sectorBrainData) {
      contextBlock += `\n=== רפרנסים מגזריים (Sector Brain) ===\n${JSON.stringify(sectorBrainData)}\n`;
    }

    const messages: Array<{role: string; content: string}> = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock }
    ];

    if (conversationHistory?.length) {
      messages.push(...conversationHistory);
    }
    messages.push({ role: 'user', content: message });

    // Step 1: Get studio agent's design directions
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

    // Extract SYSTEM_COMMAND
    let systemCommand = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { systemCommand = JSON.parse(jsonMatch[1]); } catch { /* ignore */ }
    }

    // Step 2: If generateImage is true and we have a prompt, call Nano Banana
    let generatedImageUrl = null;
    if (generateImage && systemCommand?.image_generation_prompt) {
      console.log('Generating image with Nano Banana...');
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [
            { role: 'user', content: systemCommand.image_generation_prompt }
          ],
          modalities: ['image', 'text'],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        // If we got a base64 image, upload to storage
        if (generatedImageUrl?.startsWith('data:image')) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          const base64Data = generatedImageUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `studio-agent/${Date.now()}.png`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(fileName, bytes, { contentType: 'image/png' });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(fileName);
            generatedImageUrl = urlData.publicUrl;
          }
        }
        console.log('Image generated successfully');
      } else {
        console.error('Image generation failed:', imageResponse.status);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      response: content,
      systemCommand,
      generatedImageUrl,
      agent: 'studio-agent',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Studio Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
