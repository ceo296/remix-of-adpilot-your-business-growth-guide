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

// ───── LAYER 1: Visual-only generation ─────
async function generateVisualLayer(
  fullPrompt: string,
  brandContext: any,
  LOVABLE_API_KEY: string
): Promise<{ imageUrl: string; model: string }> {
  const models = ['google/gemini-3-pro-image-preview', 'google/gemini-2.5-flash-image'];

  const messageContent: any[] = [{ type: "text", text: fullPrompt }];

  // Include logo as visual input (skip PDFs - image models can't process them)
  const logoUrl = brandContext?.logoUrl;
  const isPdfLogo = typeof logoUrl === 'string' && (logoUrl.startsWith('data:application/pdf') || logoUrl.toLowerCase().endsWith('.pdf'));
  
  if (logoUrl && !isPdfLogo) {
    console.log("Including brand logo in visual layer (image format)");
    messageContent.push({
      type: "image_url",
      image_url: { url: logoUrl }
    });
    messageContent[0].text = `IMPORTANT: The attached image is the brand's LOGO. Incorporate this exact logo prominently in the top-right or top-left corner. Do not modify the logo.\n\n` + messageContent[0].text;
  } else if (isPdfLogo) {
    console.log("Skipping PDF logo - image generation models cannot process PDF files");
    messageContent[0].text = `IMPORTANT: The brand has a logo but it's in PDF format and cannot be attached. Leave a clear, prominent space in the top-right corner for the logo to be added later.\n\n` + messageContent[0].text;
  }

  for (const tryModel of models) {
    console.log("[Layer 1 - Visual] Trying model:", tryModel);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: tryModel,
        messages: [{ role: "user", content: messageContent }],
        modalities: ["image", "text"]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log("[Layer 1 - Visual] Success with model:", tryModel);
        return { imageUrl, model: tryModel };
      }
      console.error("[Layer 1 - Visual] No image in response");
    } else {
      const status = response.status;
      const errorText = await response.text();
      console.error(`[Layer 1 - Visual] ${tryModel} error:`, status, errorText);

      if (status === 429) throw { status: 429, message: "הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות." };
      if (status === 402) throw { status: 402, message: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." };

      if (status === 500 && tryModel !== models[models.length - 1]) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }
  }
  throw { status: 500, message: "שגיאה ביצירת השכבה הויזואלית. נסה שוב." };
}

// ───── LAYER 2: Hebrew text overlay on existing image ─────
async function generateTextLayer(
  baseImageUrl: string,
  textPrompt: string,
  brandContext: any,
  campaignContext: any,
  LOVABLE_API_KEY: string
): Promise<{ imageUrl: string; model: string }> {
  // Build the Hebrew text to overlay
  const businessName = brandContext?.businessName || '';
  const headline = textPrompt || campaignContext?.offer || '';
  const phone = brandContext?.contactPhone || '';
  
  if (!headline && !businessName) {
    console.log("[Layer 2 - Text] No text to overlay, returning visual as-is");
    return { imageUrl: baseImageUrl, model: 'none' };
  }

  const textOverlayPrompt = `You are a Hebrew typography expert. Edit this advertisement image by adding ONLY the following Hebrew text as a professional overlay. 

CRITICAL TEXT RULES:
- Hebrew text reads RIGHT-TO-LEFT. Every single letter must be in correct Hebrew reading order.
- Use bold, clean, professional Hebrew fonts
- Text must be sharp, crisp, and perfectly readable
- Place text in the empty/light areas of the image without covering the main visual
- Use high contrast colors so text is readable (white text with dark shadow, or dark text on light areas)
- Text should look like it was professionally typeset by a graphic designer

TEXT TO ADD:
${businessName ? `- Brand name: "${businessName}" — place prominently, larger font` : ''}
${headline ? `- Headline: "${headline}" — main message, bold and eye-catching` : ''}
${phone ? `- Phone: "${phone}" — smaller, at the bottom` : ''}

VERY IMPORTANT: 
- Write the Hebrew letters in the CORRECT order. Hebrew is right-to-left.
- Do NOT mirror, reverse, or scramble any letters.
- Each word should be perfectly readable in Hebrew.
- If you are uncertain about letter order, just place the text exactly as provided character by character from right to left.`;

  // Use flash model for text overlay (faster, good at text)
  const textModels = ['google/gemini-2.5-flash-image', 'google/gemini-3-pro-image-preview'];
  
  for (const tryModel of textModels) {
    console.log("[Layer 2 - Text] Trying model:", tryModel);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: tryModel,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: textOverlayPrompt },
            { type: "image_url", image_url: { url: baseImageUrl } }
          ]
        }],
        modalities: ["image", "text"]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log("[Layer 2 - Text] Success with model:", tryModel);
        return { imageUrl, model: tryModel };
      }
      console.error("[Layer 2 - Text] No image in response, falling back to visual-only");
    } else {
      const status = response.status;
      console.error(`[Layer 2 - Text] ${tryModel} error:`, status);
      // Don't fail the whole pipeline if text layer fails - return visual only
      if (status === 429 || status === 402) {
        console.warn("[Layer 2 - Text] Rate/credit limit, skipping text layer");
        break;
      }
    }
  }

  // If text layer fails, return visual as-is (user can use manual text overlay)
  console.warn("[Layer 2 - Text] All attempts failed, returning visual-only image");
  return { imageUrl: baseImageUrl, model: 'fallback-visual-only' };
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

    const { visualPrompt, textPrompt, style, engine, templateId, templateHints, dimensions, brandContext, campaignContext, mediaType, topicCategory, holidaySeason, aspectRatio } = await req.json();
    console.log("Received request:", { visualPrompt, textPrompt, style, engine, templateId, mediaType, topicCategory, holidaySeason, aspectRatio, brandContext: !!brandContext, campaignContext: !!campaignContext });

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

    // Get style description
    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS['ultra-realistic'];
    const templatePrompt = templateId ? TEMPLATE_PROMPTS[templateId] || '' : '';
    const effectiveVisualPrompt = visualPrompt || campaignContext?.offer || brandContext?.winningFeature || 'עיצוב פרסומי מקצועי';
    
    // Brand color instructions
    let colorInstructions = '';
    if (brandContext?.colors?.primary) {
      colorInstructions = `MANDATORY BRAND COLORS: Primary=${brandContext.colors.primary}${brandContext.colors.secondary ? `, Secondary=${brandContext.colors.secondary}` : ''}${brandContext.colors.background ? `, Background=${brandContext.colors.background}` : ''}. These colors MUST dominate the design.`;
    }

    // Sector brain insights
    let sectorInsights = '';
    if (fameExamples.length > 0) {
      sectorInsights += `\nSuccessful ad patterns: ${fameExamples.slice(0, 5).map((e: any) => e.name + (e.text_content ? ` (${e.text_content.substring(0, 60)})` : '')).join('; ')}`;
    }
    if (redlineExamples.length > 0) {
      sectorInsights += `\nFORBIDDEN patterns: ${redlineExamples.slice(0, 5).map((e: any) => e.name + (e.text_content ? ` - ${e.text_content.substring(0, 40)}` : '')).join('; ')}`;
    }
    if (styleExamples.length > 0) {
      sectorInsights += `\nPreferred styles: ${styleExamples.slice(0, 3).map((e: any) => e.name).join(', ')}`;
    }

    // Model-specific rules
    let modelRules = '';
    if (modelConfig) {
      if (modelConfig.dos?.length) modelRules += `\nDo: ${modelConfig.dos.slice(0, 3).join('; ')}`;
      if (modelConfig.donts?.length) modelRules += `\nDon't: ${modelConfig.donts.slice(0, 3).join('; ')}`;
      if (modelConfig.logo_instructions) modelRules += `\nLogo: ${modelConfig.logo_instructions}`;
    }

    // ═══════════════════════════════════════════
    // Holiday anti-mixing rules
    // ═══════════════════════════════════════════
    const HOLIDAY_ELEMENTS: Record<string, { include: string; forbid: string }> = {
      'pesach': {
        include: 'Passover seder table, matzah, wine cups, Haggadah, spring flowers, clean kitchen',
        forbid: 'menorah, chanukiah, hanukkah candles, dreidel/sevivon, sufganiyot/donuts, sukkah, lulav, etrog, four species, shofar, honey jar, apple, megillah scroll, hamantaschen, mishloach manot, costumes, purim mask'
      },
      'chanukah': {
        include: 'Hanukkah menorah (chanukiah), candles, dreidel/sevivon, sufganiyot, olive oil, coins/gelt',
        forbid: 'seder plate, matzah, wine cups for seder, Haggadah, sukkah, lulav, etrog, shofar, megillah, hamantaschen, mishloach manot'
      },
      'sukkot': {
        include: 'Sukkah/booth, lulav, etrog, four species, decorations, schach/roof covering',
        forbid: 'menorah, chanukiah, dreidel, seder plate, matzah, shofar, megillah, hamantaschen'
      },
      'purim': {
        include: 'Megillah scroll, mishloach manot gift baskets, hamantaschen, costumes, carnival atmosphere',
        forbid: 'menorah, chanukiah, seder plate, matzah, sukkah, lulav, etrog, shofar'
      },
      'rosh_hashana': {
        include: 'Shofar, apple and honey, pomegranate, round challah, prayer book',
        forbid: 'menorah, chanukiah, dreidel, seder plate, matzah, sukkah, lulav, megillah, hamantaschen'
      },
      'yom_kippur': {
        include: 'Prayer, white clothing, synagogue, machzor prayer book, candles',
        forbid: 'menorah, chanukiah, dreidel, seder plate, matzah, sukkah, lulav, megillah, hamantaschen, food, eating'
      },
    };

    let holidayRules = '';
    if (holidaySeason && holidaySeason !== 'year_round' && HOLIDAY_ELEMENTS[holidaySeason]) {
      const hRules = HOLIDAY_ELEMENTS[holidaySeason];
      holidayRules = `
CRITICAL HOLIDAY RULES — THIS IS A ${holidaySeason.toUpperCase()} AD:
- ONLY use these holiday elements: ${hRules.include}
- ABSOLUTELY FORBIDDEN — DO NOT include ANY of these (they belong to OTHER holidays): ${hRules.forbid}
- Mixing holidays is a SEVERE ERROR that will make the ad unusable. A Hanukkah menorah in a Passover ad is completely wrong.
- If unsure about an element, DO NOT include it.`;
    } else if (!holidaySeason || holidaySeason === 'year_round') {
      holidayRules = `
HOLIDAY NEUTRALITY: This is NOT a holiday-specific ad. Do NOT include ANY holiday-specific symbols (no menorah, no seder plate, no lulav, no shofar, no megillah). Keep it generic and professional.`;
    }

    // ═══════════════════════════════════════════
    // LAYER 1: Pure visual - ZERO text
    // ═══════════════════════════════════════════
    // Aspect ratio instruction
    let aspectInstruction = '';
    if (aspectRatio === 'portrait') {
      aspectInstruction = 'IMAGE ORIENTATION: Generate a TALL PORTRAIT image (approximately 3:4 ratio). This is for a newspaper/magazine print advertisement.';
    } else if (aspectRatio === 'landscape') {
      aspectInstruction = 'IMAGE ORIENTATION: Generate a WIDE LANDSCAPE image (approximately 16:9 ratio). This is for a horizontal banner/billboard.';
    } else {
      aspectInstruction = 'IMAGE ORIENTATION: Generate a SQUARE image (1:1 ratio).';
    }

    const visualOnlyPrompt = `Generate a professional advertisement IMAGE with ABSOLUTELY ZERO TEXT.

CRITICAL - NO TEXT RULES:
- Do NOT render ANY letters, words, numbers, characters, or symbols in ANY language
- Do NOT write Hebrew, English, Arabic, or any other script
- Do NOT include phone numbers, headlines, logos with text, watermarks, or captions
- The image must be 100% VISUAL — only photography, illustration, colors, shapes, and composition
- Leave clean empty spaces (solid color bands or gradient areas) where text can be added later by a designer
- If you see a logo image attached, include it but do NOT add any text around it

${aspectInstruction}

VISUAL CONCEPT: ${effectiveVisualPrompt}
STYLE: ${styleDesc}
${templatePrompt ? `FORMAT: ${templatePrompt}` : ''}
${colorInstructions}
${holidayRules}

${brandContext ? `BRAND CONTEXT: "${brandContext.businessName || ''}" - ${brandContext.targetAudience || 'Haredi audience'}. ${brandContext.primaryXFactor ? `Differentiator: ${brandContext.primaryXFactor}` : ''}` : ''}
${campaignContext ? `CAMPAIGN: "${campaignContext.offer || ''}" - Goal: ${campaignContext.goal || 'marketing'}${campaignContext.vibe ? `, Vibe: ${campaignContext.vibe}` : ''}` : ''}

DESIGN APPROACH (CRITICAL):
- PREFER clean graphic design: bold typography areas, brand colors, abstract graphic elements, patterns, gradients
- Do NOT default to scenes with people/characters. Only include people if the visual concept explicitly requires it
- Do NOT force holiday elements unless the campaign is specifically about that holiday
- Focus on the PRODUCT/SERVICE itself, not generic "Haredi scenes"
- For dental clinic → dental imagery. For real estate → architectural/luxury visuals. For food → food photography. Keep it relevant.
- Professional, modern, clean design that happens to be for a Haredi audience — not "Haredi-themed" by default

COMMUNITY RULES:
- This targets the Haredi (Ultra-Orthodox) Jewish community
- ABSOLUTELY NO women or girls
- If people ARE needed: men/boys in modest Orthodox attire only
- Clean, premium, professional

${sectorInsights}
${modelRules}

Remember: ZERO text. Pure visual design only. Beautiful composition with empty areas for text overlay.`;

    console.log("[Pipeline] Starting Layer 1 - Visual generation");
    const visualResult = await generateVisualLayer(visualOnlyPrompt, brandContext, LOVABLE_API_KEY);
    console.log("[Pipeline] Layer 1 complete. Skipping Layer 2 — Hebrew text will be applied programmatically on the frontend for perfect rendering.");

    // ═══════════════════════════════════════════
    // LAYER 2 SKIPPED — Hebrew text is rendered programmatically by the frontend Canvas engine
    // This eliminates all AI Hebrew text rendering issues (gibberish, reversed letters, etc.)
    // ═══════════════════════════════════════════

    // Log the generation
    try {
      await supabase
        .from('ai_generation_logs')
        .insert({
          media_type: configMediaType,
          model_config_id: modelConfig?.id || null,
          prompt_used: visualOnlyPrompt.substring(0, 5000),
          generated_output: visualResult.imageUrl.substring(0, 500),
          generation_type: 'image_visual_only',
          success: true,
          brand_context: brandContext || null,
          campaign_context: campaignContext || null,
        });
    } catch (logError) {
      console.error('Error logging generation:', logError);
    }

    // Extract text meta for frontend programmatic overlay
    const headline = textPrompt || campaignContext?.offer || '';
    const businessName = brandContext?.businessName || '';
    const phone = brandContext?.contactPhone || '';

    return new Response(JSON.stringify({ 
      imageUrl: visualResult.imageUrl,
      visualOnlyUrl: visualResult.imageUrl,
      textMeta: {
        headline,
        businessName,
        phone,
      },
      status: 'approved',
      message: `שכבה ויזואלית: ${visualResult.model} | טקסט: עיבוד פרוגרמטי`,
      model: visualResult.model,
      configUsed: modelConfig?.media_type || 'default',
      layers: {
        visual: { model: visualResult.model },
        text: { model: 'programmatic-canvas' },
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-image function:", error);
    
    // Handle structured errors from layer functions
    if (error?.status && error?.message) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
