import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced style descriptions for better quality
const STYLE_DESCRIPTIONS: Record<string, string> = {
  'ultra-realistic': 'Ultra-realistic professional photograph. Studio lighting, sharp focus, high dynamic range, 8K resolution quality. Commercial photography style with perfect exposure and color grading.',
  '3d-character': '3D rendered Pixar/Disney-style characters. Vibrant saturated colors, soft ambient occlusion, subsurface scattering on skin, stylized proportions, cheerful atmosphere.',
  'oil-painting': 'Classical oil painting masterpiece. Rich impasto textures, dramatic chiaroscuro lighting, museum quality, reminiscent of Dutch Golden Age masters.',
  'flat-design': 'Modern flat design illustration. Clean vectors, bold solid colors, geometric shapes, minimalist aesthetic, trendy corporate style.',
  'watercolor': 'Delicate watercolor painting. Soft washes, organic color bleeds, artistic imperfections, gallery quality fine art.',
  'vintage-retro': 'Vintage retro advertisement style. 1950s-60s aesthetic, warm nostalgic tones, classic typography areas, Madison Avenue golden era.',
  'luxury-minimal': 'Luxury minimalist design. Elegant negative space, sophisticated color palette, premium brand aesthetic, refined simplicity.',
  'bold-graphic': 'Bold graphic poster style. High contrast, striking visual impact, dynamic composition, attention-grabbing design.',
};

// Template-specific prompt enhancements
const TEMPLATE_PROMPTS: Record<string, string> = {
  'newspaper-full': 'Full-page newspaper advertisement layout. Professional editorial design with clear visual hierarchy. Prominent headline area at top, hero product image in center, supporting text areas, contact information footer. Print-ready quality, CMYK-optimized colors.',
  'newspaper-half': 'Half-page horizontal newspaper ad. Balanced two-column layout with product on one side and text area on other. Eye-catching but newspaper-appropriate design.',
  'newspaper-quarter': 'Compact quarter-page vertical ad. Single focused message, product hero shot, minimal but impactful text areas. Newspaper column-friendly proportions.',
  'banner-leaderboard': 'Wide horizontal web banner (leaderboard format). Eye-catching gradient or pattern background, centered product/message, clear call-to-action button area on right. Web-optimized vibrant colors.',
  'banner-rectangle': 'Medium rectangle web banner. Engaging central focal point, bold headline area, prominent CTA button. Digital advertising best practices.',
  'banner-skyscraper': 'Vertical skyscraper web banner. Stacked vertical layout - logo at top, product in middle, call-to-action at bottom. Scroll-stopping design.',
  'billboard-standard': 'Outdoor billboard design. Ultra-bold, visible from 100 meters. Minimal text (5 words max area), massive product shot, dramatic sky or solid color background. High contrast for sunlight visibility.',
  'billboard-digital': 'Digital billboard HD screen. Vivid RGB colors, motion-ready design, modern urban aesthetic, premium brand feeling. Night-visible design.',
  'social-square': 'Instagram/Facebook square post. Trendy aesthetic, scroll-stopping visual, lifestyle context, share-worthy composition. Social media optimized.',
  'social-story': 'Vertical story format for Instagram/WhatsApp. Full-screen immersive design, swipe-up CTA area at bottom, bold vertical composition.',
};

// Media type to config mapping
const MEDIA_TYPE_MAP: Record<string, string> = {
  'newspaper': 'print_ads',
  'newspaper-full': 'print_ads',
  'newspaper-half': 'print_ads',
  'newspaper-quarter': 'print_ads',
  'banner': 'banners',
  'banner-leaderboard': 'banners',
  'banner-rectangle': 'banners',
  'banner-skyscraper': 'banners',
  'billboard': 'signage',
  'billboard-standard': 'signage',
  'billboard-digital': 'signage',
  'social': 'banners',
  'social-square': 'banners',
  'social-story': 'banners',
  'promo': 'promo',
};

interface AIModelConfig {
  id: string;
  media_type: string;
  model_name: string;
  system_prompt: string;
  design_rules: string[] | null;
  text_rules: string[] | null;
  logo_instructions: string | null;
  color_usage_rules: string | null;
  typography_rules: string | null;
  layout_principles: string[] | null;
  dos: string[] | null;
  donts: string[] | null;
}

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
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No API key configured (GOOGLE_GEMINI_API_KEY or LOVABLE_API_KEY)');
    }

    const { visualPrompt, textPrompt, style, engine, templateId, templateHints, dimensions, brandContext, campaignContext, mediaType, topicCategory } = await req.json();
    console.log("Received request:", { visualPrompt, textPrompt, style, engine, templateId, mediaType, topicCategory, brandContext: !!brandContext, campaignContext: !!campaignContext });

    // Initialize Supabase to fetch model config + sector brain
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine the media type for config lookup
    const configMediaType = mediaType || MEDIA_TYPE_MAP[templateId || ''] || 'print_ads';
    
    // Build sector brain query with topic filtering
    let sectorQuery = supabase
      .from('sector_brain_examples')
      .select('zone, name, text_content, stream_type, gender_audience, topic_category')
      .limit(30);
    if (topicCategory) {
      sectorQuery = supabase
        .from('sector_brain_examples')
        .select('zone, name, text_content, stream_type, gender_audience, topic_category')
        .or(`topic_category.eq.${topicCategory},topic_category.is.null`)
        .limit(30);
    }

    // Fetch model config AND sector brain examples in parallel
    const [configResult, sectorResult] = await Promise.all([
      supabase
        .from('ai_model_configs')
        .select('*')
        .eq('media_type', configMediaType)
        .eq('is_active', true)
        .maybeSingle(),
      sectorQuery
    ]);

    const modelConfig = configResult.data as AIModelConfig | null;
    if (configResult.error) console.error('Error fetching model config:', configResult.error);

    // Process sector brain examples for context
    const sectorExamples = sectorResult.data || [];
    const fameExamples = sectorExamples.filter((e: any) => e.zone === 'fame');
    const redlineExamples = sectorExamples.filter((e: any) => e.zone === 'redlines');
    const styleExamples = sectorExamples.filter((e: any) => e.zone === 'styles');
    console.log(`Sector Brain: ${fameExamples.length} fame, ${redlineExamples.length} redlines, ${styleExamples.length} styles`);

    console.log("Using model config:", modelConfig?.media_type || 'default');

    // Get style description
    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS['ultra-realistic'];
    
    // Get template-specific prompts if available
    const templatePrompt = templateId ? TEMPLATE_PROMPTS[templateId] || '' : '';

    // Build the prompt - VISUAL FIRST, minimal text approach
    const effectiveVisualPrompt = visualPrompt || campaignContext?.offer || brandContext?.winningFeature || 'עיצוב פרסומי מקצועי';
    
    // Brand color instructions
    let colorInstructions = '';
    if (brandContext?.colors?.primary) {
      colorInstructions = `MANDATORY BRAND COLORS: Primary=${brandContext.colors.primary}${brandContext.colors.secondary ? `, Secondary=${brandContext.colors.secondary}` : ''}${brandContext.colors.background ? `, Background=${brandContext.colors.background}` : ''}. These colors MUST dominate the design.`;
    }

    // Sector brain insights for prompt
    let sectorInsights = '';
    if (fameExamples.length > 0) {
      sectorInsights += `\nSuccessful ad patterns to follow: ${fameExamples.slice(0, 5).map((e: any) => e.name + (e.text_content ? ` (${e.text_content.substring(0, 60)})` : '')).join('; ')}`;
    }
    if (redlineExamples.length > 0) {
      sectorInsights += `\nFORBIDDEN patterns to AVOID: ${redlineExamples.slice(0, 5).map((e: any) => e.name + (e.text_content ? ` - ${e.text_content.substring(0, 40)}` : '')).join('; ')}`;
    }
    if (styleExamples.length > 0) {
      sectorInsights += `\nPreferred visual styles: ${styleExamples.slice(0, 3).map((e: any) => e.name).join(', ')}`;
    }

    // Model-specific rules (concise)
    let modelRules = '';
    if (modelConfig) {
      if (modelConfig.dos?.length) modelRules += `\nDo: ${modelConfig.dos.slice(0, 3).join('; ')}`;
      if (modelConfig.donts?.length) modelRules += `\nDon't: ${modelConfig.donts.slice(0, 3).join('; ')}`;
      if (modelConfig.logo_instructions) modelRules += `\nLogo: ${modelConfig.logo_instructions}`;
    }

    const fullPrompt = `Generate a professional advertisement image. This is a VISUAL design - prioritize strong imagery over text.

CRITICAL RULES:
- This ad targets the Haredi (Ultra-Orthodox) Jewish community in Israel
- ABSOLUTELY NO women or girls in any form
- Full modesty standards - men in traditional attire if shown
- Clean, premium, professional design
- MINIMAL TEXT ONLY: Maximum 3-5 Hebrew words as headline. NO paragraphs, NO long sentences
- Hebrew text must be RIGHT-TO-LEFT, clear and readable. If you cannot render Hebrew correctly, leave text areas EMPTY for later overlay
- The design should be 80% visual, 20% text areas
- DO NOT fill the image with text blocks - use bold typography for just the main headline

VISUAL CONCEPT: ${effectiveVisualPrompt}
STYLE: ${styleDesc}
${templatePrompt ? `FORMAT: ${templatePrompt}` : ''}
${colorInstructions}

${brandContext ? `BRAND: "${brandContext.businessName || ''}" - ${brandContext.targetAudience || 'Haredi audience'}. ${brandContext.primaryXFactor ? `Key differentiator: ${brandContext.primaryXFactor}` : ''}` : ''}

${campaignContext ? `CAMPAIGN: "${campaignContext.offer || ''}" - Goal: ${campaignContext.goal || 'marketing'}${campaignContext.vibe ? `, Vibe: ${campaignContext.vibe}` : ''}` : ''}

${textPrompt ? `HEADLINE TEXT (render in large, bold Hebrew typography - ONLY these words): "${textPrompt}"` : 'Leave space for headline text to be added later as overlay.'}

${sectorInsights}
${modelRules}

IMPORTANT: Create a VISUALLY STRIKING image. Think billboard/magazine ad - strong hero image, bold colors, minimal text. NOT a document or flyer full of text.`;

    console.log("Enhanced prompt length:", fullPrompt.length);

    // Use Lovable AI Gateway for image generation (direct Google API doesn't support image output)
    let response: Response | null = null;
    let usedModel = '';

    // Lovable AI Gateway - try best model first
    if (LOVABLE_API_KEY) {
      const models = ['google/gemini-3-pro-image-preview', 'google/gemini-2.5-flash-image'];
      
      for (const tryModel of models) {
        console.log("Trying Lovable gateway model:", tryModel);
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: tryModel,
            messages: [{ role: "user", content: fullPrompt }],
            modalities: ["image", "text"]
          }),
        });

        if (response.ok) {
          usedModel = tryModel;
          break;
        }
        
        const errorText = await response.text();
        console.error(`Gateway model ${tryModel} error:`, response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (response.status === 500 && tryModel !== models[models.length - 1]) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        response = null;
      }
    }

    if (!response || !response.ok) {
      return new Response(JSON.stringify({ 
        error: "שגיאה ביצירת התמונה. המודל אינו זמין כרגע, נסה שוב בעוד כמה דקות." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract image from response
    const images = data.choices?.[0]?.message?.images || [];
    const imageUrl = images[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ 
        error: "לא התקבלה תמונה מהמערכת. נסה שוב." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the generation for learning
    try {
      await supabase
        .from('ai_generation_logs')
        .insert({
          media_type: configMediaType,
          model_config_id: modelConfig?.id || null,
          prompt_used: fullPrompt.substring(0, 5000), // Limit size
          generated_output: imageUrl,
          generation_type: 'image',
          success: true,
          brand_context: brandContext || null,
          campaign_context: campaignContext || null,
        });
    } catch (logError) {
      console.error('Error logging generation:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      status: 'approved',
      message: data.choices?.[0]?.message?.content || '',
      model: usedModel,
      configUsed: modelConfig?.media_type || 'default',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-image function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
