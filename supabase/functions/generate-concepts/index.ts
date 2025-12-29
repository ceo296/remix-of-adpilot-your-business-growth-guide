import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Media type specific instructions
const MEDIA_TYPE_INSTRUCTIONS: Record<string, { name: string; format: string; example: string }> = {
  radio: {
    name: 'רדיו',
    format: 'תסריט ספוט רדיו של 30 שניות עם הנחיות לקריין',
    example: 'תסריט קצר וקליט עם הנחיות להטעמה, קצב ומוזיקה מומלצת'
  },
  ad: {
    name: 'מודעות עיתונות',
    format: 'כותרת + תת-כותרת + גוף טקסט קצר + קריאה לפעולה',
    example: 'טקסט מודעה עם היררכיה ברורה לפרסום בעיתונים ומגזינים'
  },
  banner: {
    name: 'באנר דיגיטלי',
    format: 'כותרת קצרה וקליטה + קריאה לפעולה',
    example: 'טקסט מינימלי ותמציתי שעובד בגדלים קטנים'
  },
  billboard: {
    name: 'שלט חוצות',
    format: 'משפט אחד חזק ובולט + לוגו',
    example: 'מסר קצר שנקרא ב-3 שניות מרכב נוסע'
  },
  social: {
    name: 'סושיאל מדיה',
    format: 'כיתוב לפוסט + האשטגים + קריאה לפעולה',
    example: 'טקסט מעורר עניין שמתאים לוואטסאפ, פייסבוק וניוזלטר'
  },
  all: {
    name: 'קמפיין 360°',
    format: 'מסר מרכזי שמתאים לכל הפלטפורמות',
    example: 'רעיון שיכול להתפרש למודעה, באנר, שלט חוצות ורדיו'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, mediaType, campaignBrief } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const mediaInfo = MEDIA_TYPE_INSTRUCTIONS[mediaType || 'ad'];
    const isRadio = mediaType === 'radio';

    const systemPrompt = `You are a creative director for a Haredi/Orthodox Jewish advertising agency. 
You create advertising concepts that are culturally appropriate, modest, and effective for this community.
You always respond in Hebrew.
Your concepts should be warm, family-oriented, and avoid immodest imagery.

You are creating concepts specifically for: ${mediaInfo.name}
Format required: ${mediaInfo.format}
Example: ${mediaInfo.example}

Generate exactly 3 creative concepts for ${isRadio ? 'radio spots' : 'advertising campaigns'}. Each concept should have:
1. A distinct angle (emotional, hard-sale, or pain-point)
2. ${isRadio ? 'A radio script with narration instructions' : 'A visual idea description (what the image should show)'}
3. ${isRadio ? 'The complete radio script in Hebrew (30 seconds)' : 'A short copy/slogan in Hebrew'}

Respond ONLY with valid JSON in this exact format:
{
  "concepts": [
    {
      "type": "emotional",
      "headline": "הזווית המרגשת",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'הקופי בעברית...'}"
    },
    {
      "type": "hard-sale",
      "headline": "הזווית המכירתית", 
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'הקופי בעברית...'}"
    },
    {
      "type": "pain-point",
      "headline": "פתרון הבעיה",
      "idea": "${isRadio ? 'תיאור הספוט והאווירה...' : 'תיאור הויזואל בעברית...'}",
      "copy": "${isRadio ? 'התסריט המלא לקריין...' : 'הקופי בעברית...'}"
    }
  ]
}`;

    // Campaign brief info
    const campaignTitle = campaignBrief?.title || '';
    const campaignOffer = campaignBrief?.offer || '';
    const campaignGoal = campaignBrief?.goal || '';

    const userPrompt = `Create 3 creative ${isRadio ? 'radio spot' : 'advertising'} concepts for this business:

Business Name: ${profile.business_name || 'עסק כללי'}
Target Audience: ${profile.target_audience || 'משפחות חרדיות'}
Main X-Factor/Unique Selling Point: ${profile.primary_x_factor || 'איכות ושירות'}
Winning Feature: ${profile.winning_feature || 'מקצועיות'}
Advantage Type: ${profile.advantage_type || 'שירות'}
All X-Factors: ${profile.x_factors?.join(', ') || 'איכות, מחיר, שירות'}

${campaignTitle || campaignOffer ? `
=== CAMPAIGN BRIEF - CRITICAL ===
${campaignTitle ? `Campaign Name: ${campaignTitle}` : ''}
${campaignOffer ? `MAIN OFFER/MESSAGE (MUST be the central focus of ALL concepts): ${campaignOffer}` : ''}
${campaignGoal ? `Campaign Goal: ${campaignGoal === 'promotion' ? 'Sale/Promotion' : campaignGoal === 'awareness' ? 'Brand Awareness' : campaignGoal === 'launch' ? 'Product Launch' : campaignGoal === 'seasonal' ? 'Seasonal/Holiday Campaign' : campaignGoal}` : ''}

IMPORTANT: The main offer "${campaignOffer}" MUST appear prominently in each concept's copy and be the central message. Do not create generic brand concepts - focus specifically on this offer!
=================================
` : ''}

Media Type: ${mediaInfo.name}
Format: ${mediaInfo.format}

${isRadio ? `
IMPORTANT: For radio spots:
- Write complete 30-second scripts with clear narration text
- Include notes for the narrator (tone, emphasis, pacing)
- Suggest background music style if relevant
- Include a catchy opening and strong call-to-action ending
${campaignOffer ? `- The main message "${campaignOffer}" must be mentioned clearly at least twice in the script` : ''}
` : `
The visual concepts should speak directly to this audience and highlight what makes this business special.
Tailor the text length and style to fit ${mediaInfo.name}.
${campaignOffer ? `CRITICAL: The main offer "${campaignOffer}" must be the central element in the copy and visual description. Every concept must prominently feature this offer!` : ''}
`}

Remember: Each concept needs a different angle - one emotional, one hard-sale focused, and one addressing a pain point the audience has.
${campaignOffer ? `But ALL concepts must prominently feature the main offer: "${campaignOffer}"` : ''}`;

    console.log('Generating concepts for:', profile.business_name, 'Media type:', mediaType, 'Campaign offer:', campaignBrief?.offer);

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
      // Return fallback concepts based on media type
      concepts = {
        concepts: [
          {
            type: 'emotional',
            headline: 'הזווית המרגשת',
            idea: isRadio 
              ? `ספוט רדיו חם ומשפחתי עבור ${profile.business_name || 'העסק'}` 
              : `תמונה חמימה של משפחה נהנית מ${profile.business_name || 'השירות'}`,
            copy: isRadio 
              ? `(קול קריין חם) "${profile.business_name || 'אנחנו'} - כי המשפחה שלכם מגיעה את הכי טוב. התקשרו עכשיו!"` 
              : 'כי המשפחה שלכם מגיעה את הכי טוב'
          },
          {
            type: 'hard-sale',
            headline: 'הזווית המכירתית',
            idea: isRadio 
              ? `ספוט אנרגטי עם מבצע מיוחד` 
              : `תקריב על המוצר/שירות של ${profile.business_name || 'העסק'} עם רקע יוקרתי`,
            copy: isRadio 
              ? `(קול קריין נמרץ) "מבצע מיוחד ב${profile.business_name || 'העסק'}! רק השבוע - מחירים שלא תאמינו! התקשרו עכשיו!"` 
              : 'הזדמנות מיוחדת - למהר לפני שנגמר!'
          },
          {
            type: 'pain-point',
            headline: 'פתרון הבעיה',
            idea: isRadio 
              ? `ספוט שמתחיל מהבעיה ומציע פתרון` 
              : 'אדם רגוע ומחייך אחרי שמצא את הפתרון המושלם',
            copy: isRadio 
              ? `(קול קריין מבין) "נמאס לחפש? ${profile.business_name || 'אנחנו כאן'} - ${profile.primary_x_factor || 'הפתרון המושלם'}. סוף סוף מישהו שמבין!"` 
              : `${profile.primary_x_factor || 'השירות המושלם'} - סוף סוף מישהו שמבין`
          }
        ]
      };
    }

    // Add IDs and media type to concepts
    const conceptsWithIds = concepts.concepts.map((c: any, i: number) => ({
      ...c,
      id: `${c.type}-${Date.now()}-${i}`,
      mediaType: mediaType || 'ad'
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
