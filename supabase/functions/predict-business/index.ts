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
    const { brandName, websiteUrl } = await req.json();
    
    if (!brandName) {
      return new Response(
        JSON.stringify({ error: 'Brand name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Predicting business info for: ${brandName}, URL: ${websiteUrl || 'none'}`);

    const systemPrompt = `אתה מומחה לניתוח עסקים בשוק החרדי בישראל. 
המשימה שלך היא לנחש פרטים על עסק על סמך שם העסק וכתובת האתר (אם ניתנה).
הנחה: העסק פועל במגזר החרדי/דתי בישראל.

כללים חשובים לזיהוי קהל יעד:
- עסקי מזון, מאפים, קייטרינג, מסעדות = קהל יעד: משפחות חרדיות או כלל הציבור החרדי (צרכנים פרטיים!)
- חנויות קמעונאיות (בגדים, אלקטרוניקה, ריהוט) = קהל יעד: משפחות חרדיות או כלל הציבור החרדי
- עסקים שמוכרים לעסקים אחרים (B2B) בלבד = קהל יעד: בעלי עסקים
- מוסדות חינוך וגנים = קהל יעד: הורים (משפחות חרדיות)
- שירותי בניין, שיפוצים לבתים = קהל יעד: משפחות חרדיות

חשוב: החזר את התשובה בפורמט JSON בלבד, ללא טקסט נוסף.`;

    const userPrompt = `נתח את העסק הבא:
שם העסק: ${brandName}
${websiteUrl ? `כתובת האתר: ${websiteUrl}` : 'אין כתובת אתר'}

נחש את הפרטים הבאים והחזר בפורמט JSON:
{
  "industry": "תחום העיסוק (לדוגמה: ריהוט לבית ולמשרד, מזון ומאפים, טכנולוגיה ומחשוב, אופנה והלבשה, שירותי בריאות, חינוך והדרכה, נדל\"ן, שירותים פיננסיים, אירועים ושמחות)",
  "audience": "קהל היעד - שים לב: אם זה עסק שמוכר לצרכן הסופי (אוכל, בגדים, מוצרים לבית) התשובה צריכה להיות 'משפחות חרדיות' או 'כלל הציבור החרדי'. רק אם זה עסק שמוכר לעסקים אחרים (B2B) בחר 'בעלי עסקים'. אפשרויות: משפחות חרדיות, קהילות חסידיות, ציבור ליטאי, נשים חרדיות, גברים חרדיים, בעלי עסקים, מוסדות חינוך, כלל הציבור החרדי",
  "coreOffering": "המוצר או השירות המרכזי של העסק - משפט קצר",
  "seniority": "הערכה לגבי ותק העסק (לדוגמה: עסק ותיק, עסק חדש, פעיל מזה מספר שנים)"
}`;

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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);

    // Parse JSON from response
    let predictions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback predictions
      predictions = {
        industry: 'אחר',
        audience: 'כלל הציבור החרדי',
        coreOffering: '',
        seniority: '',
      };
    }

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in predict-business:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
