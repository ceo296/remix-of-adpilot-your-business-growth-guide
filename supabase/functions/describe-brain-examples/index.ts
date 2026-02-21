import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
  if (!roleData) {
    return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { batchSize = 10 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Get examples without descriptions (images only)
    const { data: examples, error: fetchError } = await supabase
      .from('sector_brain_examples')
      .select('id, name, file_path, file_type, zone, topic_category, holiday_season, stream_type, gender_audience')
      .in('file_type', ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'png', 'jpg', 'jpeg', 'webp'])
      .or('description.is.null,description.eq.')
      .limit(Math.min(batchSize, 20));

    if (fetchError) throw fetchError;
    if (!examples?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: 'All examples already have descriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: Array<{ id: string; name: string; description: string; success: boolean }> = [];

    for (const example of examples) {
      try {
        // Build public URL for the image
        const { data: urlData } = supabase.storage.from('sector-brain').getPublicUrl(example.file_path);
        const imageUrl = urlData?.publicUrl;
        if (!imageUrl) { results.push({ id: example.id, name: example.name, description: '', success: false }); continue; }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `אתה מנתח מודעות פרסום במגזר החרדי. תאר את המודעה הזו בקצרה (2-3 משפטים) תוך התייחסות ל:
1. סוג העיצוב (גרפי נקי / צילום מוצר / אילוסטרציה / צילום עם דמויות)
2. פלטת הצבעים הדומיננטית
3. סגנון הטיפוגרפיה (גודל, היררכיה, פונט)
4. הקומפוזיציה והלייאאוט
5. האווירה הכללית (יוקרתי / שמח / מקצועי / חגיגי)
6. אם יש טקסט — ציין את הכותרת הראשית

ענה בעברית בלבד. תיאור קצר ותמציתי.`
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const description = data.choices?.[0]?.message?.content || '';
          if (description) {
            await supabase.from('sector_brain_examples').update({ description }).eq('id', example.id);
            results.push({ id: example.id, name: example.name, description, success: true });
          } else {
            results.push({ id: example.id, name: example.name, description: '', success: false });
          }
        } else {
          console.error(`Failed to describe ${example.name}:`, response.status);
          results.push({ id: example.id, name: example.name, description: '', success: false });
          if (response.status === 429) break; // Stop on rate limit
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Error processing ${example.name}:`, e);
        results.push({ id: example.id, name: example.name, description: '', success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const { count: remaining } = await supabase
      .from('sector_brain_examples')
      .select('id', { count: 'exact', head: true })
      .in('file_type', ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'png', 'jpg', 'jpeg', 'webp'])
      .or('description.is.null,description.eq.');

    return new Response(JSON.stringify({
      success: true,
      processed: successCount,
      failed: results.length - successCount,
      remaining: remaining || 0,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Describe error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
