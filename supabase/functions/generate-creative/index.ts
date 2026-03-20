import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SectorExample {
  zone: string;
  name: string;
  file_path: string;
  text_content: string | null;
  stream_type: string | null;
  gender_audience: string | null;
  topic_category: string | null;
  holiday_season: string | null;
}

// Helper function to determine relevant holidays based on campaign dates
function getRelevantHolidays(startDate?: string, endDate?: string): string[] {
  if (!startDate) return [];
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  
  const holidays: string[] = [];
  const startMonth = start.getMonth(); // 0-11
  const endMonth = end.getMonth();
  
  // Check which months the campaign spans and add relevant holidays
  // These are approximate - Hebrew calendar dates vary each year
  const monthsInCampaign = new Set<number>();
  let currentMonth = startMonth;
  while (true) {
    monthsInCampaign.add(currentMonth);
    if (currentMonth === endMonth) break;
    currentMonth = (currentMonth + 1) % 12;
    if (monthsInCampaign.size > 12) break; // Safety
  }
  
  // Pesach - March/April (months 2-3)
  if (monthsInCampaign.has(2) || monthsInCampaign.has(3)) {
    holidays.push('pesach');
  }
  
  // Shavuot - May/June (months 4-5)
  if (monthsInCampaign.has(4) || monthsInCampaign.has(5)) {
    holidays.push('shavuot');
  }
  
  // Summer + Bein Hazmanim - June/July/August (months 5-7)
  if (monthsInCampaign.has(5) || monthsInCampaign.has(6) || monthsInCampaign.has(7)) {
    holidays.push('summer');
    holidays.push('bein_hazmanim');
  }
  
  // Rosh Hashana / Yom Kippur - September/October (months 8-9)
  if (monthsInCampaign.has(8) || monthsInCampaign.has(9)) {
    holidays.push('rosh_hashana');
    holidays.push('yom_kippur');
  }
  
  // Sukkot - September/October (months 8-9)
  if (monthsInCampaign.has(8) || monthsInCampaign.has(9)) {
    holidays.push('sukkot');
  }
  
  // Chanukah - November/December (months 10-11)
  if (monthsInCampaign.has(10) || monthsInCampaign.has(11)) {
    holidays.push('chanukah');
  }
  
  // Tu Bishvat - January/February (months 0-1)
  if (monthsInCampaign.has(0) || monthsInCampaign.has(1)) {
    holidays.push('tu_bishvat');
  }
  
  // Purim - February/March (months 1-2)
  if (monthsInCampaign.has(1) || monthsInCampaign.has(2)) {
    holidays.push('purim');
  }
  
  // Lag BaOmer - April/May (months 3-4)
  if (monthsInCampaign.has(3) || monthsInCampaign.has(4)) {
    holidays.push('lag_baomer');
  }
  
  // Always include year_round examples
  holidays.push('year_round');
  
  return holidays;
}

const HOLIDAY_LABELS: Record<string, string> = {
  pesach: 'פסח',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  shavuot: 'שבועות',
  lag_baomer: 'ל"ג בעומר',
  tu_bishvat: 'ט"ו בשבט',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  year_round: 'כל השנה',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { 
      prompt, 
      style, 
      aspectRatio,
      topicCategory,
      streamType,
      genderAudience,
      brandContext,
      campaignContext
    } = await req.json();

    console.log('Received request:', { prompt, style, aspectRatio, topicCategory, streamType, genderAudience });

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client to fetch sector brain examples
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine relevant holidays based on campaign dates
    const relevantHolidays = getRelevantHolidays(
      campaignContext?.startDate,
      campaignContext?.endDate
    );
    console.log('Relevant holidays for campaign:', relevantHolidays);

    // Fetch relevant examples from sector_brain_examples
    let query = supabase
      .from('sector_brain_examples')
      .select('zone, name, file_path, text_content, stream_type, gender_audience, topic_category, holiday_season');

    // We'll fetch all matching examples and filter in code for more flexibility
    const { data: allExamples, error: examplesError } = await query.limit(100);

    if (examplesError) {
      console.error('Error fetching sector examples:', examplesError);
    }

    // Filter examples based on criteria
    let examples = (allExamples || []).filter((ex: SectorExample) => {
      // Match by topic category if specified
      if (topicCategory && ex.topic_category && ex.topic_category !== topicCategory) {
        return false;
      }
      
      // Match by stream type if specified
      if (streamType && ex.stream_type && ex.stream_type !== streamType) {
        return false;
      }
      
      // Match by gender audience if specified
      if (genderAudience && ex.gender_audience && ex.gender_audience !== genderAudience) {
        return false;
      }
      
      return true;
    });

    // Separate holiday-specific examples
    const holidayExamples = examples.filter((ex: SectorExample) => 
      ex.holiday_season && relevantHolidays.includes(ex.holiday_season)
    );
    
    const generalExamples = examples.filter((ex: SectorExample) => 
      !ex.holiday_season || ex.holiday_season === 'year_round'
    );

    // Prioritize holiday examples, then fill with general
    const prioritizedExamples = [
      ...holidayExamples.slice(0, 10),
      ...generalExamples.slice(0, 10)
    ].slice(0, 20);

    console.log(`Found ${prioritizedExamples.length} relevant sector examples (${holidayExamples.length} holiday-specific)`);

    // Build the enhanced prompt with sector brain knowledge
    let enhancedPrompt = prompt;
    
    // Separate prioritized examples by zone
    const fameExamples = prioritizedExamples.filter((e: SectorExample) => e.zone === 'fame') || [];
    const redlineExamples = prioritizedExamples.filter((e: SectorExample) => e.zone === 'redlines') || [];
    const styleExamples = prioritizedExamples.filter((e: SectorExample) => e.zone === 'styles') || [];

    // Build sector brain context
    let sectorBrainContext = '';
    
    // Add holiday context if relevant
    if (relevantHolidays.length > 0 && relevantHolidays[0] !== 'year_round') {
      const holidayNames = relevantHolidays
        .filter(h => h !== 'year_round')
        .map(h => HOLIDAY_LABELS[h] || h)
        .join(', ');
      sectorBrainContext += `\n\n=== עונה/חג רלוונטי: ${holidayNames} ===\n`;
      sectorBrainContext += `התמונה צריכה להתאים לאווירה של ${holidayNames}.\n`;
    } else {
  sectorBrainContext += `\n\n=== אין חג ספציפי — ניטרליות מוחלטת ===\n`;
      sectorBrainContext += `אסור בתכלית האיסור לשלב כל סמל דתי או פולחני (חנוכיה, גביע קידוש, קערת סדר, שופר, לולב, מגילה, נרות שבת, ספר תורה, טלית, תפילין, מזוזה).\n`;
      sectorBrainContext += `המודעה חייבת להתמקד אך ורק במוצר/שירות המפורסם. מרפאת שיניים = שיניים. נדל"ן = בניינים. אופנה = בגדים. שילוב סמל דתי כשאין חג = טעות מקצועית חמורה.\n`;
    }

    if (fameExamples.length > 0) {
      sectorBrainContext += `\n\n=== דוגמאות מוצלחות ללמוד מהן ===\n`;
      fameExamples.forEach((ex: SectorExample, i: number) => {
        sectorBrainContext += `דוגמה ${i + 1}: ${ex.name}`;
        if (ex.text_content) {
          sectorBrainContext += `\nתוכן: ${ex.text_content}`;
        }
        if (ex.topic_category) {
          sectorBrainContext += ` (תחום: ${ex.topic_category})`;
        }
        if (ex.holiday_season && ex.holiday_season !== 'year_round') {
          sectorBrainContext += ` [${HOLIDAY_LABELS[ex.holiday_season] || ex.holiday_season}]`;
        }
        sectorBrainContext += '\n';
      });
    }

    if (redlineExamples.length > 0) {
      sectorBrainContext += `\n\n=== קווים אדומים - להימנע! ===\n`;
      redlineExamples.forEach((ex: SectorExample, i: number) => {
        sectorBrainContext += `אזהרה ${i + 1}: ${ex.name}`;
        if (ex.text_content) {
          sectorBrainContext += ` - ${ex.text_content}`;
        }
        sectorBrainContext += '\n';
      });
    }

    if (styleExamples.length > 0) {
      sectorBrainContext += `\n\n=== סגנונות מועדפים ===\n`;
      styleExamples.forEach((ex: SectorExample, i: number) => {
        sectorBrainContext += `סגנון ${i + 1}: ${ex.name}`;
        if (ex.text_content) {
          sectorBrainContext += ` - ${ex.text_content}`;
        }
        sectorBrainContext += '\n';
      });
    }

    // Add brand context if provided
    let brandSection = '';
    if (brandContext) {
      brandSection = `\n\n=== זהות המותג ===\n`;
      if (brandContext.businessName) brandSection += `שם העסק: ${brandContext.businessName}\n`;
      if (brandContext.primaryColor) brandSection += `צבע ראשי: ${brandContext.primaryColor}\n`;
      if (brandContext.secondaryColor) brandSection += `צבע משני: ${brandContext.secondaryColor}\n`;
      if (brandContext.targetAudience) brandSection += `קהל יעד: ${brandContext.targetAudience}\n`;
      if (brandContext.xFactors?.length) brandSection += `גורמי X: ${brandContext.xFactors.join(', ')}\n`;
      
      // Contact details for the contact strip
      brandSection += `\n--- פרטי קשר למודעה ---\n`;
      if (brandContext.phone) brandSection += `טלפון: ${brandContext.phone}\n`;
      if (brandContext.whatsapp) brandSection += `וואטסאפ: ${brandContext.whatsapp}\n`;
      if (brandContext.email) brandSection += `אימייל: ${brandContext.email}\n`;
      if (brandContext.address) brandSection += `כתובת ראשית: ${brandContext.address}\n`;
      if (brandContext.branches) brandSection += `סניפים: ${brandContext.branches}\n`;
      if (brandContext.websiteUrl) brandSection += `אתר: ${brandContext.websiteUrl}\n`;
      if (brandContext.openingHours) brandSection += `שעות פתיחה: ${brandContext.openingHours}\n`;
    }

    // Add campaign context if provided
    let campaignSection = '';
    if (campaignContext) {
      campaignSection = `\n\n=== הקמפיין ===\n`;
      if (campaignContext.goal) campaignSection += `מטרה: ${campaignContext.goal}\n`;
      if (campaignContext.vibe) campaignSection += `וייב: ${campaignContext.vibe}\n`;
      if (campaignContext.targetStream) campaignSection += `זרם: ${campaignContext.targetStream}\n`;
      if (campaignContext.targetGender) campaignSection += `מגדר יעד: ${campaignContext.targetGender}\n`;
    }

    // Typography strategy block
    const typographyBlock = `
═══ אסטרטגיית טיפוגרפיה (Typography Strategy 2026) ═══

📋 זוגות פונטים מומלצים לקמפיינים:
• מכירתי / אקטיבי: כותרות ב-Suez One (400), טקסט ב-Heebo (400). כותרות חזקות ודומיננטיות.
• טכנולוגי / נקי: כותרות ב-Assistant (800), טקסט ב-Assistant (300). מדרג כולו בפונט אחד.
• מסורתי / אמין: כותרות ב-Secular One (400), טקסט ב-Heebo (400). משדר יציבות.
${brandContext?.headerFont ? `\n⚡ פונט המותג: כותרות="${brandContext.headerFont}", גוף="${brandContext.bodyFont || 'Heebo'}". השתמש בו כברירת מחדל.` : ''}

🔒 חוקי Finishing:
1. CONTRAST IS KING: לעולם אל תשתמש באותו משקל לכותרת ולטקסט. מינימום 300 הפרש.
2. HAREDI TONE: הטיפוגרפיה חייבת לשדר מכובדות. אסור פונטים ילדותיים או שבורים.
3. HIERARCHY FIRST: גודל ומשקל הפונט קובעים חשיבות — לא צבע.
4. LINE-HEIGHT: בכותרות — צפוף (1.05-1.15) ליצירת "גוש" מסר. בגוף — מרווח (1.6-1.8).

═══ בידוד נכסי לקוח ═══
פונטים פרטיים שהועלו על ידי הלקוח משויכים אליו בלבד. אסור להציע פונט של לקוח X ללקוח Y.
`;

    // Build the full system prompt
    const systemPrompt = `[CORE MISSION] You are a world-class Advertising Art Director and Editorial Photographer specializing in high-end luxury brands for the Haredi (Ultra-Orthodox) Jewish sector. Your goal is to generate ONE single, cohesive, and organic photographic masterpiece.

[VISUAL STYLE - MANDATORY]
NO COLLAGES: Never create split screens, grids, or multiple separate images in one frame. The output must be a single, holistic scene.
CINEMATIC QUALITY: Use 35mm or 50mm lens aesthetics with a shallow depth of field (blurred background) to create a premium feel.
LIGHTING: Professional "Golden Hour" or soft studio lighting. Avoid harsh, flat, or clinical "Fluorescent" lights.
TEXTURE: High detail on materials (wood grain, fabric texture, skin pores).

[HAREDI AUTHENTICITY - CULTURAL GUARDRAILS]
PEOPLE: If characters are present, they must be strictly authentic to the Haredi-Litvish or Hasidic aesthetic.
- Men: Dark suits, white shirts, dark velvet or silk kippot, neatly groomed beards, authentic side-curls (Peyot) tucked or visible as per the brief.
- Women/Girls: Strictly modest (Tzniut). High necklines, long sleeves (past elbows), skirts past knees, refined and elegant hair/wigs (Sheitels) or head-coverings.
ENVIRONMENT: Upscale, clean, and prestigious Jewish homes or professional settings.

[COMPOSITION FOR ADS — BASED ON REAL HAREDI AD ANALYSIS]
=== 3-ZONE AD GRID (top to bottom) ===
ZONE 1 — HEADLINE / HOOK (top 15-20%): Main promotional headline, large bold typography.
ZONE 2 — HERO VISUAL (center 55-65%): Product photography or lifestyle scene. Cinematic quality.
ZONE 3 — CONTACT STRIP (bottom 15-25%): Dark or brand-colored bar. Logo on LEFT (RTL), contact details on RIGHT.
  - Branch cities in BOLD, separated by bullets or pipes.
  - Phone number LARGE and clear. Website clean (no https://).
  - Opening hours near branches if available.

=== LOGO RULES ===
- Logo must occupy 15-25% of ad width — NEVER a tiny icon.
- Position: bottom-left of contact strip, prominent and anchored.
- Logo in ORIGINAL brand colors — never recolored.

=== CONTACT DETAILS IN ADS ===
- ALWAYS include: business name, phone, at least one address/branch.
- Include if available: website, WhatsApp, opening hours, additional branches.
- If 3+ branches, list cities horizontally (e.g., "בני ברק | ירושלים | אשדוד").

NEGATIVE SPACE: Ensure 30% of the frame is clean for Hebrew typography overlay.
EMOTIONAL CONNECTION: Focus on story, not just product display.

[NEGATIVE PROMPT - NEVER SHOW] Text inside the image, invented/fabricated logos, split-screens, multiple panels, clinical/stock-photo look, low-quality CGI, immodest clothing, non-Haredi religious symbols, distorted limbs, messy backgrounds.

[IRON RULE — LOGO] NEVER invent, design, or generate a new logo. Use ONLY the client's actual logo if attached as an image. If no logo is attached, leave space empty — do NOT create any logo substitute, symbol, monogram, or emblem.

הנחיות נוספות ספציפיות:
- אין להציג תמונות נשים או ילדות כלל (אלא אם התבקש במפורש ויזואלית צנועה ביותר, וגם אז בזהירות רבה)
- טקסט בעברית בלבד (אם נדרש טקסט, אך עדיף ללא טקסט בתמונה עצמה)
${sectorBrainContext}${brandSection}${campaignSection}
${typographyBlock}

מידע נוסף:
- סגנון: ${style || 'מודרני ונקי'}
- יחס גובה-רוחב: ${aspectRatio || 'מרובע'}`;

    // Try Google Gemini API directly first, then Lovable gateway as fallback
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      console.error('No API key configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imageUrl = '';
    let usedMethod = '';

    // Use Nano Banana 2 (gemini-3.1-flash-image-preview) via Lovable AI Gateway
    // This is the correct image generation model — do NOT use gemini-2.0-flash-exp or other text models
    const IMAGE_MODELS = ['google/gemini-3.1-flash-image-preview', 'google/gemini-2.5-flash-image'];
    
    // Attempt via Lovable AI Gateway with proper image model
    if (!imageUrl && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable AI Gateway...');
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3.1-flash-image-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: enhancedPrompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const aiData = await aiResponse.json();
        imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
        usedMethod = 'lovable-gateway';
      }
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate image from all sources' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image generated via:', usedMethod);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        prompt: enhancedPrompt,
        style: style || 'default',
        aspectRatio: aspectRatio || 'square',
        sectorExamplesUsed: prioritizedExamples.length,
        holidayExamplesUsed: holidayExamples.length,
        relevantHolidays,
        model: usedMethod,
        message: 'Image generated successfully with Sector Brain knowledge',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-creative function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
