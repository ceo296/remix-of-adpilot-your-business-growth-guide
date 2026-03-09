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

  // Auth check
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
    const { brandName, websiteUrl, scrapedContent, brandingInfo } = await req.json();
    
    if (!brandName && !websiteUrl && !scrapedContent) {
      return new Response(
        JSON.stringify({ error: 'Brand name or website URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const hasScrapedData = !!(scrapedContent || brandingInfo);
    console.log(`Predicting business info for: ${brandName || 'unknown'}, URL: ${websiteUrl || 'none'}, hasScrapedData: ${hasScrapedData}`);

    const systemPrompt = `אתה מומחה לניתוח עסקים בשוק החרדי בישראל. 
המשימה שלך היא לזהות פרטים על עסק על סמך המידע שמסופק לך.
הנחה: העסק פועל במגזר החרדי/דתי בישראל.

כללים חשובים:
1. אם יש תוכן שנשאב מהאתר (scrapedContent) - זה המקור האמין ביותר! השתמש בו כבסיס העיקרי לניתוח.
2. שם העסק שמסופק עשוי להיות שגוי או מיושן - אם התוכן מהאתר מצביע על שם עסק אחר, העדף את מה שכתוב באתר.
3. זהה את שם העסק האמיתי מתוך התוכן שנשאב (כותרות, לוגו, תוכן ראשי).

כללים לזיהוי קהל יעד:
- עסקי מזון, מאפים, קייטרינג, מסעדות = קהל יעד: משפחות חרדיות או כלל הציבור החרדי
- חנויות קמעונאיות (בגדים, אלקטרוניקה, ריהוט) = קהל יעד: משפחות חרדיות או כלל הציבור החרדי
- עסקים שמוכרים לעסקים אחרים (B2B) בלבד = קהל יעד: בעלי עסקים
- מוסדות חינוך וגנים = קהל יעד: הורים (משפחות חרדיות)
- שירותי בניין, שיפוצים לבתים = קהל יעד: משפחות חרדיות
- שירותי בריאות, רפואה, טיפולים = קהל יעד: כלל הציבור החרדי

חשוב: החזר את התשובה בפורמט JSON בלבד, ללא טקסט נוסף.`;

    // Build user prompt with all available data
    let userPrompt = `נתח את העסק הבא:\n`;
    
    if (brandName) {
      userPrompt += `שם העסק שהוזן: ${brandName}\n`;
    }
    if (websiteUrl) {
      userPrompt += `כתובת האתר: ${websiteUrl}\n`;
    }
    
    if (scrapedContent) {
      userPrompt += `\nתוכן שנשאב מהאתר (זה המקור האמין ביותר!):\n${scrapedContent}\n`;
    }
    
    if (brandingInfo) {
      const brandingStr = typeof brandingInfo === 'string' ? brandingInfo : JSON.stringify(brandingInfo);
      userPrompt += `\nמידע מיתוגי שנשאב מהאתר:\n${brandingStr}\n`;
    }

    userPrompt += `
חשוב מאוד: אם התוכן מהאתר מציג שם עסק שונה מ"${brandName || ''}", השתמש בשם שמופיע באתר!

נחש את הפרטים הבאים והחזר בפורמט JSON:
{
  "businessName": "שם העסק האמיתי כפי שזוהה מהתוכן (אם יש תוכן מהאתר - העדף את השם שמופיע שם)",
  "industry": "תחום העיסוק (לדוגמה: ריהוט לבית ולמשרד, מזון ומאפים, טכנולוגיה ומחשוב, אופנה והלבשה, שירותי בריאות, חינוך והדרכה, נדל\"ן, שירותים פיננסיים, אירועים ושמחות)",
  "audience": "קהל היעד - בחר מהאפשרויות: משפחות חרדיות, קהילות חסידיות, ציבור ליטאי, נשים חרדיות, גברים חרדיים, בעלי עסקים, מוסדות חינוך, כלל הציבור החרדי",
  "coreOffering": "המוצר או השירות המרכזי של העסק - משפט קצר",
  "seniority": "הערכה לגבי ותק העסק (לדוגמה: עסק ותיק, עסק חדש, פעיל מזה מספר שנים)",
  "services": ["שירות 1", "שירות 2", "שירות 3"],
  "phone": "מספר טלפון אם נמצא בתוכן או null",
  "email": "כתובת מייל אם נמצאה בתוכן או null",
  "address": "כתובת פיזית אם נמצאה בתוכן או null",
  "whatsapp": "מספר וואטסאפ אם נמצא בתוכן או null",
  "facebook": "קישור לפייסבוק אם נמצא בתוכן או null",
  "instagram": "שם משתמש או קישור לאינסטגרם אם נמצא בתוכן או null",
  "youtube": "קישור ליוטיוב אם נמצא בתוכן או null",
  "linkedin": "קישור ללינקדאין אם נמצא בתוכן או null",
  "tiktok": "שם משתמש או קישור לטיקטוק אם נמצא בתוכן או null"
}

הערה חשובה לגבי services: זהה 3-8 שירותים או מוצרים עיקריים שהעסק מציע. כל פריט צריך להיות קצר (2-5 מילים). אם יש תוכן מהאתר, חלץ את השירותים ממנו. אם אין - נחש שירותים טיפוסיים לתחום.

הערה קריטית לגבי פרטי קשר:
- חפש מספרי טלפון בפורמטים שונים: 03-XXXXXXX, 077-XXXXXXX, 052-XXXXXXX, *XXXX, 1-800-XXX-XXX וכו'. חפש גם מספרים בפורמט בינלאומי (+972).
- חפש כתובות מייל (כל דבר עם @).
- חפש קישורים לרשתות חברתיות (facebook.com, instagram.com, youtube.com, linkedin.com, tiktok.com, wa.me, api.whatsapp.com).
- חפש כתובות פיזיות (שמות רחובות, ערים, מיקודים).
- אם לא מצאת מידע ספציפי - החזר null. אל תמציא! עדיף null מאשר מידע שגוי.`;


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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
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
