import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { imageDataUrl } = await req.json();
    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: 'Missing imageDataUrl' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!LOVABLE_API_KEY && !GOOGLE_GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const analysisPrompt = `You are an expert graphic designer and art director. Analyze this advertisement image and extract the following information in a structured JSON format.

IMPORTANT: Be extremely precise and specific. This data will be used to replicate the layout in new designs.

Return ONLY a valid JSON object with these exact fields:

{
  "logoPosition": "Exact position of the logo (e.g., 'top-right corner', 'top-left with padding', 'center-top', 'bottom-right'). Include approximate size relative to the ad (e.g., 'small ~10% width', 'medium ~20% width')",
  "gridStructure": "Describe the layout grid precisely (e.g., '3-zone vertical: header band 15%, hero image 60%, info footer 25%', 'asymmetric 2-column: 60% image left, 40% text right', 'full-bleed image with floating text overlay'). Mention alignment, spacing zones, and hierarchy.",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "typography": "Describe the typography: headline style (bold/light, serif/sans-serif, approximate size), body text style, any decorative text. Mention if Hebrew or Latin. Describe text alignment (RTL, centered, etc.)",
  "detectedFonts": {
    "headerStyle": "Describe the HEADLINE font style precisely: weight (bold/black/regular), type (serif/sans-serif/display/slab), feel (geometric/humanist/elegant/rounded/condensed)",
    "bodyStyle": "Describe the BODY TEXT font style: weight, type, feel",
    "recommendedHeaderFont": "Pick the BEST matching Hebrew Google Font for the headline from this list ONLY: Assistant, Heebo, Rubik, Alef, David Libre, Frank Ruhl Libre, Secular One, Suez One",
    "recommendedBodyFont": "Pick the BEST matching Hebrew Google Font for the body text from this list ONLY: Assistant, Heebo, Rubik, Alef, David Libre, Frank Ruhl Libre, Secular One, Suez One",
    "confidence": "high/medium/low - how confident are you in the font match?"
  },
  "layoutNotes": "Any additional observations: visual style (modern/classic/luxury), use of borders/frames, background treatment (gradient/solid/texture/photo), whitespace usage, call-to-action placement, contact info placement"
}

FONT MATCHING RULES:
- Thick/bold/geometric headlines → "Secular One" or "Rubik"
- Elegant/serif/traditional headlines → "Frank Ruhl Libre" or "Suez One" or "David Libre"
- Clean/modern/minimalist headlines → "Heebo" or "Assistant"
- Rounded/friendly headlines → "Rubik" or "Alef"
- For body text: prefer readable fonts like "Heebo", "Assistant", or "Rubik"
- Actually look at the weight and style — don't default to "Assistant"

Analyze every detail. The colorPalette should contain 3-6 dominant colors as hex values.`;

    let content = '';

    // Try Google Gemini first (supports vision natively)
    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('[Ad Analysis] Trying Google Gemini...');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: analysisPrompt },
                  { inlineData: {
                    mimeType: imageDataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
                    data: imageDataUrl.split(',')[1]
                  }}
                ]
              }],
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          console.error('[Ad Analysis] Gemini error:', response.status);
        }
      } catch (e) {
        console.error('[Ad Analysis] Gemini fetch error:', e);
      }
    }

    // Fallback to Lovable Gateway
    if (!content && LOVABLE_API_KEY) {
      console.log('[Ad Analysis] Trying Lovable Gateway...');
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
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        content = data.choices?.[0]?.message?.content || '';
      } else {
        console.error('[Ad Analysis] Gateway error:', response.status);
      }
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse JSON from response - robust extraction
    let analysis;
    try {
      // Strip markdown fences
      let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Find JSON object boundaries
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON object found');
      }

      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

      try {
        analysis = JSON.parse(cleaned);
      } catch {
        // Fix common LLM JSON issues
        cleaned = cleaned
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/[\x00-\x1F\x7F]/g, '')
          .replace(/'/g, '"');

        // Try to close truncated JSON
        const openBraces = (cleaned.match(/{/g) || []).length;
        const closeBraces = (cleaned.match(/}/g) || []).length;
        const openBrackets = (cleaned.match(/\[/g) || []).length;
        const closeBrackets = (cleaned.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) cleaned += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) cleaned += '}';

        // Remove trailing comma before closing
        cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        analysis = JSON.parse(cleaned);
      }
    } catch (parseErr) {
      console.error('[Ad Analysis] JSON parse error:', parseErr, 'Raw content (first 500):', content.substring(0, 500));
      // Return a best-effort fallback from raw text
      analysis = {
        logoPosition: 'unknown',
        gridStructure: 'unknown',
        colorPalette: ['#333333', '#666666', '#999999'],
        typography: content.substring(0, 200),
        layoutNotes: 'AI response could not be fully parsed. Please retry.'
      };
    }

    console.log('[Ad Analysis] Success:', JSON.stringify(analysis).substring(0, 200));

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Ad Analysis] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
