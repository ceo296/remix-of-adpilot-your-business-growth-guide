import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, brandColor } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const enhancedPrompt = `Create a stunning, high-quality 16:9 professional presentation slide background image. 
${prompt}. 
Style: Ultra premium, photorealistic, cinematic lighting, shallow depth of field, professional corporate photography. 
Color accent hint: ${brandColor || '#E34870'}. 
Important: No text, no letters, no words, no watermarks. Clean visual only. 4K quality, dramatic lighting.`;

    const models = ['google/gemini-3.1-flash-image-preview', 'google/gemini-2.5-flash-image'];
    let imageUrl: string | null = null;

    for (const model of models) {
      try {
        console.log(`[generate-slide-image] Trying model: ${model}`);
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: enhancedPrompt }],
            modalities: ['image', 'text'],
          }),
        });

        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!response.ok) {
          const text = await response.text();
          console.error(`Model ${model} failed: ${response.status}`, text);
          continue;
        }

        const rawText = await response.text();
        let data: unknown;
        try {
          data = JSON.parse(rawText);
        } catch (_parseErr) {
          console.error(`JSON parse failed for ${model}, raw length: ${rawText.length}, tail: ${rawText.slice(-100)}`);
          continue;
        }

        // deno-lint-ignore no-explicit-any
        imageUrl = (data as any)?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageUrl) {
          console.log(`[generate-slide-image] Success with ${model}`);
          break;
        }
        console.error(`No image in response from ${model}`);
      } catch (fetchErr) {
        console.error(`Fetch error for ${model}:`, fetchErr);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!imageUrl) {
      throw new Error('No image generated after all model attempts');
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-slide-image error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
