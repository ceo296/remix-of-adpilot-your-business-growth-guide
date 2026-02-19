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

    // Build the full system prompt
    const systemPrompt = `אתה מעצב גרפי מומחה ליצירת פרסומות לקהילה החרדית בישראל.
עליך ליצור תמונה פרסומית על פי ההנחיות הבאות.

חוקים קריטיים:
- אין להציג תמונות נשים או ילדות כלל
- שמירה על צניעות מלאה
- עיצוב נקי ומכובד
- טקסט בעברית בלבד
${sectorBrainContext}${brandSection}${campaignSection}

הנחיות נוספות:
- סגנון: ${style || 'מודרני ונקי'}
- יחס גובה-רוחב: ${aspectRatio || 'מרובע'}`;

    // Call Lovable AI Gateway for image generation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling Lovable AI Gateway for image generation...');
    console.log('System prompt length:', systemPrompt.length);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
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
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract the generated image URL
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in AI response:', JSON.stringify(aiData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
        message: 'Image generated successfully with Sector Brain knowledge',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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
