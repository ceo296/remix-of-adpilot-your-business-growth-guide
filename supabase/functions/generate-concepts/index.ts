import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a creative director for a Haredi/Orthodox Jewish advertising agency. 
You create advertising concepts that are culturally appropriate, modest, and effective for this community.
You always respond in Hebrew.
Your concepts should be warm, family-oriented, and avoid immodest imagery.

Generate exactly 3 creative concepts for advertising campaigns. Each concept should have:
1. A distinct angle (emotional, hard-sale, or pain-point)
2. A visual idea description (what the image should show)
3. A short copy/slogan in Hebrew

Respond ONLY with valid JSON in this exact format:
{
  "concepts": [
    {
      "type": "emotional",
      "headline": "הזווית המרגשת",
      "idea": "תיאור הויזואל בעברית...",
      "copy": "הקופי בעברית..."
    },
    {
      "type": "hard-sale",
      "headline": "הזווית המכירתית", 
      "idea": "תיאור הויזואל בעברית...",
      "copy": "הקופי בעברית..."
    },
    {
      "type": "pain-point",
      "headline": "פתרון הבעיה",
      "idea": "תיאור הויזואל בעברית...",
      "copy": "הקופי בעברית..."
    }
  ]
}`;

    const userPrompt = `Create 3 creative advertising concepts for this business:

Business Name: ${profile.business_name || 'עסק כללי'}
Target Audience: ${profile.target_audience || 'משפחות חרדיות'}
Main X-Factor/Unique Selling Point: ${profile.primary_x_factor || 'איכות ושירות'}
Winning Feature: ${profile.winning_feature || 'מקצועיות'}
Advantage Type: ${profile.advantage_type || 'שירות'}
All X-Factors: ${profile.x_factors?.join(', ') || 'איכות, מחיר, שירות'}

The concepts should speak directly to this audience and highlight what makes this business special.
Remember: Each concept needs a different angle - one emotional, one hard-sale focused, and one addressing a pain point the audience has.`;

    console.log('Generating concepts for:', profile.business_name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

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
      throw new Error(`AI Gateway error: ${response.status}`);
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
      // Return fallback concepts
      concepts = {
        concepts: [
          {
            type: 'emotional',
            headline: 'הזווית המרגשת',
            idea: `תמונה חמימה של משפחה נהנית מ${profile.business_name || 'השירות'}`,
            copy: 'כי המשפחה שלכם מגיעה את הכי טוב'
          },
          {
            type: 'hard-sale',
            headline: 'הזווית המכירתית',
            idea: `תקריב על המוצר/שירות של ${profile.business_name || 'העסק'} עם רקע יוקרתי`,
            copy: 'הזדמנות מיוחדת - למהר לפני שנגמר!'
          },
          {
            type: 'pain-point',
            headline: 'פתרון הבעיה',
            idea: 'אדם רגוע ומחייך אחרי שמצא את הפתרון המושלם',
            copy: `${profile.primary_x_factor || 'השירות המושלם'} - סוף סוף מישהו שמבין`
          }
        ]
      };
    }

    // Add IDs to concepts
    const conceptsWithIds = concepts.concepts.map((c: any, i: number) => ({
      ...c,
      id: `${c.type}-${Date.now()}-${i}`
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
