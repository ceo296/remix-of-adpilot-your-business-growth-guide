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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { visualPrompt, textPrompt, style, engine, templateId, templateHints, dimensions, brandContext, campaignContext, mediaType } = await req.json();
    console.log("Received request:", { visualPrompt, textPrompt, style, engine, templateId, mediaType, brandContext: !!brandContext, campaignContext: !!campaignContext });

    // Initialize Supabase to fetch model config
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine the media type for config lookup
    const configMediaType = mediaType || MEDIA_TYPE_MAP[templateId || ''] || 'print_ads';
    
    // Fetch the model config for this media type
    const { data: modelConfig, error: configError } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('media_type', configMediaType)
      .eq('is_active', true)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching model config:', configError);
    }

    console.log("Using model config:", modelConfig?.media_type || 'default');

    // Get style description
    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS['ultra-realistic'];
    
    // Get template-specific prompts if available
    const templatePrompt = templateId ? TEMPLATE_PROMPTS[templateId] || '' : '';
    const additionalHints = templateHints || '';

    // Build model-specific rules section
    let modelRulesSection = '';
    if (modelConfig) {
      modelRulesSection = `
=== הנחיות ספציפיות לסוג מדיה: ${modelConfig.media_type} ===

${modelConfig.system_prompt}

${modelConfig.logo_instructions ? `הנחיות לוגו:
${modelConfig.logo_instructions}` : ''}

${modelConfig.color_usage_rules ? `כללי צבעים:
${modelConfig.color_usage_rules}` : ''}

${modelConfig.typography_rules ? `כללי טיפוגרפיה:
${modelConfig.typography_rules}` : ''}

${modelConfig.design_rules?.length ? `כללי עיצוב:
${modelConfig.design_rules.map((r: string) => `• ${r}`).join('\n')}` : ''}

${modelConfig.text_rules?.length ? `כללי טקסט:
${modelConfig.text_rules.map((r: string) => `• ${r}`).join('\n')}` : ''}

${modelConfig.layout_principles?.length ? `עקרונות פריסה:
${modelConfig.layout_principles.map((r: string) => `• ${r}`).join('\n')}` : ''}

${modelConfig.dos?.length ? `לעשות:
${modelConfig.dos.map((r: string) => `✓ ${r}`).join('\n')}` : ''}

${modelConfig.donts?.length ? `לא לעשות:
${modelConfig.donts.map((r: string) => `✗ ${r}`).join('\n')}` : ''}
`;
    }

    // Build brand identity section for prompt
    let brandSection = '';
    if (brandContext) {
      const colorParts: string[] = [];
      if (brandContext.colors?.primary) colorParts.push(`צבע ראשי: ${brandContext.colors.primary}`);
      if (brandContext.colors?.secondary) colorParts.push(`צבע משני: ${brandContext.colors.secondary}`);
      if (brandContext.colors?.background) colorParts.push(`צבע רקע: ${brandContext.colors.background}`);
      
      brandSection = `
=== זהות המותג ===
- שם העסק: ${brandContext.businessName || 'לא צוין'}
- קהל יעד: ${brandContext.targetAudience || 'קהל חרדי כללי'}
- יתרון תחרותי: ${brandContext.primaryXFactor || 'איכות ושירות'}
- פיצ'ר מנצח: ${brandContext.winningFeature || ''}
${brandContext.xFactors?.length ? `- ערכי המותג: ${brandContext.xFactors.join(', ')}` : ''}

${colorParts.length > 0 ? `צבעי המותג (חובה להשתמש בהם!):
${colorParts.join('\n')}
העיצוב חייב להשתמש בצבעים אלו כצבעים הדומיננטיים.` : ''}

${brandContext.logoUrl ? `
=== לוגו המותג ===
יש לשלב את לוגו המותג בעיצוב בהתאם להנחיות הלוגו למעלה.
כתובת הלוגו: ${brandContext.logoUrl}` : ''}

${brandContext.fonts?.header ? `- סגנון פונט כותרות: ${brandContext.fonts.header}` : ''}`;
    }

    // Build campaign section for prompt
    let campaignSection = '';
    if (campaignContext) {
      campaignSection = `
=== הקמפיין ===
- שם: ${campaignContext.title || 'קמפיין שיווקי'}
- הצעה/מסר עיקרי: ${campaignContext.offer || visualPrompt}
- מטרה: ${campaignContext.goal === 'awareness' ? 'מודעות למותג' : 
                   campaignContext.goal === 'promotion' ? 'מבצע/הנחה' :
                   campaignContext.goal === 'launch' ? 'השקה' :
                   campaignContext.goal === 'seasonal' ? 'עונתי/חג' : 'שיווק כללי'}
${campaignContext.vibe ? `- אווירה: ${campaignContext.vibe}` : ''}
${campaignContext.targetStream ? `- זרם: ${campaignContext.targetStream}` : ''}
${campaignContext.targetGender ? `- מגדר יעד: ${campaignContext.targetGender}` : ''}

המודעה חייבת להעביר בבירור את המסר: "${campaignContext.offer}"`;
    }

    // Build enhanced prompt
    let fullPrompt = '';
    
    // Ensure we have some visual prompt
    const effectiveVisualPrompt = visualPrompt || campaignContext?.offer || brandContext?.winningFeature || 'עיצוב פרסומי מקצועי';
    
    // Base system prompt for Haredi audience
    const baseSystemPrompt = `צור תמונת פרסומת בעברית. אתה מעצב גרפי מומחה ליצירת פרסומות לקהילה החרדית בישראל.

חוקים קריטיים שחובה לשמור:
- אין להציג תמונות נשים או ילדות כלל!
- שמירה על צניעות מלאה בכל אלמנט
- עיצוב נקי, מכובד ומקצועי
- טקסט בעברית בלבד (מימין לשמאל)
- אין תוכן פוגעני או לא צנוע

חובה: צור ותחזיר תמונה!`;

    if (engine === 'nano-banana' || !engine) {
      // Gemini Pro Image - highest quality with Hebrew text support
      fullPrompt = `${baseSystemPrompt}

=== סגנון ===
${styleDesc}

${modelRulesSection}
${brandSection}
${campaignSection}

${templatePrompt ? `=== פורמט ===
${templatePrompt}` : ''}

=== הסצנה ===
${effectiveVisualPrompt}

${additionalHints ? `הנחיות נוספות: ${additionalHints}` : ''}

${textPrompt ? `=== טקסט עברי לשלב ===
"${textPrompt}"
הטקסט העברי חייב להיות:
- בולט וקריא לחלוטין
- משולב באלגנטיות בעיצוב
- בטיפוגרפיה מקצועית
- מימין לשמאל כמובן` : 'אין לכלול טקסט בתמונה.'}

${dimensions ? `מידות: ${dimensions.width}x${dimensions.height} פיקסלים` : ''}

${brandContext?.colors?.primary ? `חובה: השתמש בצבעי המותג (${brandContext.colors.primary}${brandContext.colors.secondary ? `, ${brandContext.colors.secondary}` : ''}) כצבעים הדומיננטיים!` : ''}
${campaignContext?.offer ? `המסר "${campaignContext.offer}" צריך להיות המוקד המרכזי` : ''}

צור עכשיו את התמונה!`;

    } else {
      // Flux model for non-text photorealism
      fullPrompt = `${baseSystemPrompt}

=== סגנון ===
${styleDesc}

${modelRulesSection}
${brandSection}
${campaignSection}

${templatePrompt ? `=== פורמט ===
${templatePrompt}` : ''}

=== הסצנה ===
${effectiveVisualPrompt}

${additionalHints ? `הנחיות נוספות: ${additionalHints}` : ''}

דרישות:
- איכות פוטו-ריאליסטית גבוהה
- תאורה וקומפוזיציה מקצועיות
- ללא טקסט בתמונה
- מותאם לקהל חרדי - צניעות מלאה
- איכות פרסום מסחרי
${brandContext?.colors?.primary ? `- סכמת הצבעים תואמת למותג: ${brandContext.colors.primary}${brandContext.colors.secondary ? `, ${brandContext.colors.secondary}` : ''}` : ''}

צור עכשיו את התמונה!`;
    }

    console.log("Enhanced prompt length:", fullPrompt.length);

    // Select best model based on requirements
    const model = (engine === 'nano-banana' || textPrompt) 
      ? 'google/gemini-3-pro-image-preview'  // Best for Hebrew text
      : 'google/gemini-2.5-flash-image';      // Fast for no-text images

    console.log("Using model:", model);

    // Try primary model first, then fallback
    const models = [model, model === 'google/gemini-3-pro-image-preview' ? 'google/gemini-2.5-flash-image' : 'google/gemini-3-pro-image-preview'];
    
    let response: Response | null = null;
    let usedModel = model;
    
    for (const tryModel of models) {
      console.log("Trying model:", tryModel);
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: tryModel,
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (response.ok) {
        usedModel = tryModel;
        break;
      }
      
      const errorText = await response.text();
      console.error(`Model ${tryModel} error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // If 500, try next model
      if (response.status === 500 && tryModel !== models[models.length - 1]) {
        console.log(`Model ${tryModel} returned 500, trying fallback...`);
        continue;
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
