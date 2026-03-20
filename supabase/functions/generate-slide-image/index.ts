import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, brandColor, industry } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Detect creative intuition type from prompt prefix
    let intuitionStyle = '';
    if (prompt.startsWith('Human Connection:')) {
      intuitionStyle = 'Shallow depth of field (f/1.8 bokeh), warm golden hour lighting, emotional and personal. Focus on the human element with cinematic portrait quality.';
    } else if (prompt.startsWith('Conceptual Objects:')) {
      intuitionStyle = 'Macro photography, dramatic studio lighting, extreme detail and texture. Premium product photography aesthetic with perfect styling.';
    } else if (prompt.startsWith('Abstract Atmosphere:')) {
      intuitionStyle = 'Deep gradients, moody atmospheric textures, dramatic light rays. No specific objects - pure mood and emotion through color and light.';
    }

    // Industry-specific style directives
    const industryStyles: Record<string, string> = {
      'dental': 'Warm, inviting, bright and clean atmosphere. Soft natural lighting, welcoming mood. Smiling faces, hygiene, comfort. Never dark or gloomy.',
      'medical': 'Clean, warm, professional medical environment. Soft lighting, trust and care feeling. No cold/dark tones.',
      'healthcare': 'Warm, inviting healthcare setting. Gentle lighting, comfort and trust. Pastel and warm tones.',
      'real_estate': 'Luxury architectural visualization, premium interiors/exteriors. Dramatic lighting, elegant dark tones allowed.',
      'food': 'Appetizing macro food photography, warm natural light, clean styling, vibrant colors, shallow depth of field.',
      'education': 'Warm, cheerful, family-friendly atmosphere. Bright colors, welcoming and playful mood.',
      'legal': 'Elegant office atmosphere, symbolic objects (luxury pen, bookshelf), stable and restrained grid.',
      'finance': 'Professional office setting, clean and organized, trust-building elements.',
    };

    const ind = (industry || '').toLowerCase();
    const styleHint = Object.entries(industryStyles).find(([k]) => ind.includes(k))?.[1] || '';

    // Clean the prefix from the prompt
    const cleanPrompt = prompt
      .replace(/^Human Connection:\s*/i, '')
      .replace(/^Conceptual Objects:\s*/i, '')
      .replace(/^Abstract Atmosphere:\s*/i, '');

    const enhancedPrompt = `Create a stunning, high-quality 16:9 professional presentation slide background image.

Scene: ${cleanPrompt}

${intuitionStyle ? `Creative Direction: ${intuitionStyle}` : ''}
${styleHint ? `Industry Style: ${styleHint}` : ''}

Technical: Ultra premium quality, cinematic composition, professional photography.
Color accent hint: ${brandColor || '#E34870'}.
CRITICAL: No text, no letters, no words, no watermarks, no women, no girls. Clean visual only.
If humans appear, only Haredi Orthodox Jewish men/boys in dignified settings.
4K quality, dramatic lighting, shallow depth of field.`;

    const MODEL = 'google/gemini-3.1-flash-image-preview';
    let imageUrl: string | null = null;

    console.log(`[generate-slide-image] Generating with ${MODEL}`);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
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
      console.error(`${MODEL} failed: ${response.status}`, text);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const rawText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch (_parseErr) {
      console.error(`JSON parse failed, raw length: ${rawText.length}`);
      throw new Error('Failed to parse image generation response');
    }

    // deno-lint-ignore no-explicit-any
    imageUrl = (data as any)?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      throw new Error('No image in response from model');
    }
    console.log(`[generate-slide-image] Success with ${MODEL}`);

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
