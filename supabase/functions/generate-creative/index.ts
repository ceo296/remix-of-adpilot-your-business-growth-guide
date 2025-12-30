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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Fetch relevant examples from sector_brain_examples
    let query = supabase
      .from('sector_brain_examples')
      .select('zone, name, file_path, text_content, stream_type, gender_audience, topic_category');

    // Filter by topic category if provided
    if (topicCategory) {
      query = query.eq('topic_category', topicCategory);
    }

    // Filter by stream type if provided
    if (streamType) {
      query = query.eq('stream_type', streamType);
    }

    // Filter by gender audience if provided
    if (genderAudience) {
      query = query.eq('gender_audience', genderAudience);
    }

    const { data: examples, error: examplesError } = await query.limit(20);

    if (examplesError) {
      console.error('Error fetching sector examples:', examplesError);
    }

    console.log(`Found ${examples?.length || 0} relevant sector examples`);

    // Build the enhanced prompt with sector brain knowledge
    let enhancedPrompt = prompt;
    
    // Separate examples by zone
    const fameExamples = examples?.filter((e: SectorExample) => e.zone === 'fame') || [];
    const redlineExamples = examples?.filter((e: SectorExample) => e.zone === 'redlines') || [];
    const styleExamples = examples?.filter((e: SectorExample) => e.zone === 'styles') || [];

    // Build sector brain context
    let sectorBrainContext = '';

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
        sectorExamplesUsed: examples?.length || 0,
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
