import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced style descriptions for better quality
const ART_DIRECTOR_GUIDELINES = `
[CORE MISSION] You are a world-class Advertising Art Director and Editorial Photographer specializing in high-end luxury brands for the Haredi (Ultra-Orthodox) Jewish sector. Your goal is to generate ONE single, cohesive, and organic photographic masterpiece.

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

[COMPOSITION FOR ADS]
NEGATIVE SPACE: Always ensure 30% of the frame is "clean" (blurred background or empty wall) to allow for professional Hebrew typography to be overlaid later.
EMOTIONAL CONNECTION: Focus on the "Story" (e.g., a father and son learning, a mother’s calm, the prestige of a product) rather than just "displaying an item."

[NEGATIVE PROMPT - NEVER SHOW] Text inside the image, invented/fabricated logos, split-screens, multiple panels, clinical/stock-photo look, low-quality CGI, immodest clothing, distorted limbs, messy backgrounds. CRITICAL: Do NOT include religious/ritual objects (menorah, chanukiah, kiddush cup, seder plate, shofar, lulav, etrog, dreidel, Torah scroll) UNLESS the campaign is explicitly tagged for a specific holiday. A dental/real-estate/food ad must NEVER contain religious symbols.

[IRON RULE — LOGO] NEVER invent, design, or generate a new logo. Use ONLY the client's actual logo if attached as an image. If no logo image is attached, leave space empty — do NOT create any logo substitute, symbol, monogram, or emblem.

[IRON RULE — VISUAL QA & ANATOMY]
- Children MUST look like children: smooth faces, NO facial hair (no mustache, no beard, no stubble). A boy should have a child's face.
- Hands MUST have exactly 5 fingers, properly proportioned. No extra/missing/fused fingers.
- Eyes must be symmetrical and natural. No crossed eyes, no misaligned pupils.
- Food must look appetizing, realistic, and properly textured. No plastic-looking or alien food.
- If generating a person eating: the food and the person must be proportionally correct, the grip must be natural.
- SELF-CHECK before finalizing: "Does any element look uncanny, deformed, or embarrassing?" If yes — regenerate that element.

[IRON RULE — LAYOUT GRID]
- The logo area must be LARGE, PROMINENT, and clearly visible — not a tiny icon in a corner. Treat the logo as a key design element.
- Follow professional ad grid: headline at top/upper-center, hero visual in center, CTA clearly visible, contact strip with prominent logo at bottom.
- Study the reference ads from Sector Brain — replicate their grid proportions, logo size, and visual hierarchy.
`;

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

// Media format-specific generation instructions (used when mediaType is passed)
const MEDIA_FORMAT_INSTRUCTIONS: Record<string, string> = {
  'banner': `
MEDIA FORMAT: WEB BANNER / DIGITAL AD
- Generate a WIDE HORIZONTAL image optimized for digital screens (leaderboard or rectangle banner format).
- Use VIVID RGB colors suitable for screen display (not CMYK print tones).
- Design must be SCROLL-STOPPING: bold focal point, high contrast, immediately readable composition.
- The visual must work at SMALL SIZES — avoid tiny details that disappear when scaled down.
- Keep the composition clean and MINIMAL — banners have limited real estate.
- Leave clear horizontal zones for headline text overlay on the left/right side.
- Think: Google Display Ads, web banners, WhatsApp status bars.
`,
  'billboard': `
MEDIA FORMAT: OUTDOOR BILLBOARD / STREET SIGNAGE
- Generate a WIDE PANORAMIC image (16:9 or wider) for LARGE-FORMAT outdoor display.
- Design must be LEGIBLE FROM 50+ METERS: ultra-bold composition, maximum contrast, minimal elements.
- Use NO MORE THAN 3-5 visual elements total — billboards are consumed in 3 seconds while driving.
- MASSIVE subject: fill 70%+ of frame with the hero visual. Nothing tiny or detailed.
- Colors must be HIGH CONTRAST and WEATHER-VISIBLE: works in direct sunlight and at night.
- DRAMATIC SCALE: the visual should feel monumental, grand, and imposing.
- The composition should feel like a CINEMA SCREEN — epic, wide, immersive.
- MOCKUP CONTEXT: Imagine this displayed on a large outdoor billboard on an urban street. The design should feel powerful and contextually appropriate for outdoor advertising.
- Leave a BOLD, PROMINENT zone for a very short headline (3-5 words max for billboard readability).
`,
  'social': `
MEDIA FORMAT: SOCIAL MEDIA POST (SQUARE 1:1)
- Generate a SQUARE image optimized for Instagram/Facebook/WhatsApp feed posts.
- Design must be THUMB-STOPPING: immediately engaging when scrolling through a feed.
- Use TRENDY aesthetics: modern gradients, lifestyle photography, aspirational compositions.
- The visual should invite ENGAGEMENT — shareworthy, relatable, visually striking.
- Instagram-quality photography: natural light feel, warm tones, lifestyle context.
- Leave strategic space for text overlay that doesn't obscure the main subject.
`,
  'ad': `
MEDIA FORMAT: PRINT ADVERTISEMENT (NEWSPAPER/MAGAZINE)
- Generate a TALL PORTRAIT image for print media (approximately 3:4 ratio).
- Use PRINT-OPTIMIZED colors: rich, deep tones that reproduce well in CMYK print.
- Design follows EDITORIAL AD conventions: clear visual hierarchy, professional grid structure.
- Think full-page magazine advertisements: luxurious, detailed, high-production-value photography.
- PREMIUM PRINT QUALITY: fine textures, subtle gradients, editorial photography standards.
- Structure: headline zone at top, hero visual center, contact/logo bar at bottom.
`,
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

// Engine version → model priority mapping
const ENGINE_MODELS: Record<string, string[]> = {
  'nano-banana-pro': ['google/gemini-3.1-flash-image-preview', 'google/gemini-2.5-flash-image'],
  'nano-banana': ['google/gemini-3.1-flash-image-preview', 'google/gemini-2.5-flash-image'],
};

// ───── LAYER 1: Visual-only generation ─────
async function generateVisualLayer(
  fullPrompt: string,
  brandContext: any,
  LOVABLE_API_KEY: string,
  engineVersion: string = 'nano-banana-pro',
  campaignContext?: any
): Promise<{ imageUrl: string; model: string }> {
  const models = ENGINE_MODELS[engineVersion] || ENGINE_MODELS['nano-banana-pro'];

  const messageContent: any[] = [{ type: "text", text: ART_DIRECTOR_GUIDELINES + "\n\n" + fullPrompt }];

  // ═══ PAST MATERIALS as visual references (HIGHEST priority for brand-follower/visual-refresh) ═══
  const pastMaterialUrls = brandContext?.pastMaterialUrls || [];
  const designApproach = brandContext?.designApproach;
  const shouldUsePastMaterials = pastMaterialUrls.length > 0 && 
    (designApproach === 'brand-follower' || designApproach === 'visual-refresh');
  
  if (shouldUsePastMaterials) {
    const materialsToInclude = pastMaterialUrls.slice(0, 3); // Max 3 to avoid overloading
    for (const matUrl of materialsToInclude) {
      if (matUrl && typeof matUrl === 'string' && !matUrl.startsWith('data:application/pdf')) {
        console.log("Including PAST MATERIAL as visual reference:", matUrl.substring(0, 80));
        messageContent.push({
          type: "image_url",
          image_url: { url: matUrl }
        });
      }
    }
    messageContent[0].text = `
═══ CRITICAL — BRAND CONTINUITY REFERENCE IMAGES ATTACHED (${materialsToInclude.length} images) ═══
The attached images are the client's EXISTING advertising materials. These are your PRIMARY design reference.
YOU MUST:
1. Match the EXACT same grid structure and layout proportions (where is the headline? where is the visual? where is the contact bar?)
2. Match the same visual DENSITY and STYLE (clean/minimal vs bold/colorful)
3. Match the same COMPOSITION approach (centered vs asymmetric, photo-driven vs graphic-led)
4. Match the same COLOR TEMPERATURE and MOOD
5. The new ad should look like the NEXT AD in the same campaign series
A viewer should NOT be able to tell a different designer made this ad.
═══════════════════════════════════════════════════════════════
\n\n` + messageContent[0].text;
  }

  // Include campaign-specific image if provided (highest priority visual reference)
  const campaignImageUrl = campaignContext?.campaignImageUrl;
  if (campaignImageUrl && !campaignImageUrl.startsWith('data:application/pdf')) {
    console.log("Including client campaign image as PRIMARY visual reference");
    messageContent.push({
      type: "image_url",
      image_url: { url: campaignImageUrl }
    });
    messageContent[0].text = `CRITICAL: The client has provided a SPECIFIC CAMPAIGN IMAGE (attached). Use this as the PRIMARY visual reference — incorporate or draw strong inspiration from this image in the final design.\n\n` + messageContent[0].text;
  }

  // Include business photos as visual references (up to 2 to avoid overloading)
  const businessPhotoUrls = brandContext?.businessPhotoUrls || [];
  const photosToInclude = businessPhotoUrls.slice(0, 2);
  for (const photoUrl of photosToInclude) {
    if (photoUrl && typeof photoUrl === 'string' && !photoUrl.startsWith('data:application/pdf')) {
      console.log("Including business photo as visual reference:", photoUrl.substring(0, 80));
      messageContent.push({
        type: "image_url",
        image_url: { url: photoUrl }
      });
    }
  }
  if (photosToInclude.length > 0) {
    messageContent[0].text = `The client has provided ${photosToInclude.length} REAL business/product photos (attached). Draw inspiration from these actual products/settings to create authentic visuals.\n\n` + messageContent[0].text;
  }

  // Include design reference (specific past material selected by user)
  const designRefUrl = brandContext?.designReference?.url;
  if (designRefUrl && typeof designRefUrl === 'string' && !designRefUrl.startsWith('data:application/pdf')) {
    console.log("Including DESIGN REFERENCE image:", designRefUrl.substring(0, 80));
    messageContent.push({
      type: "image_url",
      image_url: { url: designRefUrl }
    });
    messageContent[0].text = `
═══ SPECIFIC DESIGN REFERENCE (HIGHEST PRIORITY) ═══
The client has selected ONE SPECIFIC past ad (attached) as the PRIMARY reference for this new design.
REPLICATE its exact grid, layout, color balance, and visual hierarchy as closely as possible.
This is NOT just inspiration — this is the TEMPLATE to follow.
═══════════════════════════════════════════════════════
\n\n` + messageContent[0].text;
  }

  // IRON RULE: NEVER send logo to AI image generator
  // The logo is ALWAYS handled by the programmatic HTML overlay (Layer 2)
  messageContent[0].text = `IRON RULE — LOGO: Do NOT include ANY logo, emblem, symbol, monogram, or brand mark in the image. The brand logo will be added in post-production as a separate layer. Leave the BOTTOM-LEFT corner completely clean and empty. ANY attempt to generate, recreate, or place a logo is a CRITICAL ERROR that ruins the ad.\n\n` + messageContent[0].text;

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
  const textModels = ['google/gemini-3.1-flash-image-preview', 'google/gemini-2.5-flash-image'];
  
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

function normalizePromptText(value: string): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function buildCreativeHeadline(rawHeadline: string, campaignContext: any, topicCategory?: string): string {
  // Priority: explicit textPrompt > offer from brief
  const source = normalizePromptText(rawHeadline || campaignContext?.offer || '');
  if (!source) return '';

  // Clean up: strip trailing punctuation, limit to 40 chars max (punchy headline)
  let cleaned = source.replace(/[.!?،,]+$/g, '').trim();
  
  // If over 40 chars, try to find a natural break point
  if (cleaned.length > 40) {
    const breakIdx = cleaned.lastIndexOf(' ', 40);
    cleaned = breakIdx > 15 ? cleaned.slice(0, breakIdx).trim() : cleaned.slice(0, 40).trim();
  }
  
  return cleaned;
}

function buildSecondaryLines(rawSource: string, businessName: string): { subtitle: string; bodyText: string } {
  const source = normalizePromptText(rawSource);
  const fallbackSubtitle = '';
  const fallbackBody = '';

  if (!source) return { subtitle: fallbackSubtitle, bodyText: fallbackBody };

  // Try to extract meaningful sub-elements from the brief:
  // 1. Look for discount/promo lines
  const promoMatch = source.match(/(\d{1,3}%\s*הנחה[^.!]*)/);
  // 2. Look for price/package lines
  const priceMatch = source.match(/(\d{3,5}\s*(?:ש"ח|₪)[^.!]*)/);
  // 3. Look for key USP phrases
  const uspMatch = source.match(/(היתרון[^.!]*|הכי חשוב[^.!]*|לא קוסמטיקאית[^.!]*|רופאה[^.!]*)/i);
  
  if (promoMatch || priceMatch || uspMatch) {
    const subtitle = (uspMatch?.[1] || promoMatch?.[1] || '').slice(0, 56).trim();
    const bodyText = (promoMatch?.[1] || priceMatch?.[1] || '').slice(0, 68).trim();
    if (subtitle || bodyText) return { subtitle, bodyText };
  }

  const parts = source
    .split(/[•|–—]/)
    .map((p) => normalizePromptText(p))
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      subtitle: parts[0].slice(0, 56),
      bodyText: parts[1].slice(0, 68),
    };
  }

  if (source.length <= 56) {
    return {
      subtitle: source,
      bodyText: fallbackBody,
    };
  }

  return {
    subtitle: source.slice(0, 56).trim(),
    bodyText: source.slice(56, 124).trim() || fallbackBody,
  };
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

    const { visualPrompt, textPrompt, style, engine, templateId, templateHints, dimensions, brandContext, campaignContext, mediaType, topicCategory, holidaySeason, aspectRatio, visualApproach, designApproach, corrections, variationIndex, headlinePosition } = await req.json();
    console.log("Received request:", { visualPrompt, textPrompt, style, engine, templateId, mediaType, topicCategory, holidaySeason, aspectRatio, headlinePosition, brandContext: brandContext ? { businessName: brandContext.businessName, colors: brandContext.colors, logoUrl: !!brandContext.logoUrl } : null, corrections: corrections?.length || 0 });

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
    
    // Brand color instructions — STRICT ENFORCEMENT
    let colorInstructions = '';
    if (brandContext?.colors?.primary) {
      colorInstructions = `
═══ MANDATORY BRAND COLORS — NON-NEGOTIABLE ═══
Primary Color: ${brandContext.colors.primary} — This color MUST appear as the DOMINANT accent color in the image.
${brandContext.colors.secondary ? `Secondary Color: ${brandContext.colors.secondary} — Use as supporting accent, dividers, highlights.` : ''}
${brandContext.colors.background ? `Background tendency: ${brandContext.colors.background}` : ''}

COLOR ENFORCEMENT RULES:
1. The primary brand color (${brandContext.colors.primary}) must be CLEARLY VISIBLE and dominant in the composition.
2. Use it for: color accents, gradient washes, light tinting, rim lighting, colored shadows, background elements.
3. Do NOT replace brand colors with random colors. A brand with blue (#1E3A5F) must NOT get orange highlights.
4. The overall color MOOD of the image must harmonize with the brand palette.
5. If the brand color is warm (reds/oranges/golds) → warm lighting. Cool (blues/greens) → cool lighting.
═══════════════════════════════════════════════════
`;
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
HOLIDAY NEUTRALITY — THIS IS THE MOST CRITICAL RULE:
This is NOT a holiday-specific ad. It is a regular commercial advertisement.

ABSOLUTELY FORBIDDEN — ANY of these objects will RUIN the ad and make it unusable:
❌ Menorah / Chanukiah (candelabrum)
❌ Kiddush cup / wine goblet  
❌ Seder plate / matzah
❌ Shofar (ram's horn)
❌ Lulav / Etrog / Four species
❌ Dreidel / Sevivon
❌ Torah scroll / open book of Torah
❌ Tefillin / Tallit
❌ Megillah scroll
❌ Religious candles (Shabbat/Hanukkah)
❌ Hamantaschen / Mishloach manot

These objects are ONLY relevant for holiday-specific campaigns. Including them in a ${topicCategory || 'commercial'} ad is like putting a Christmas tree in a summer ad — a CATASTROPHIC professional error.

The ad is for: ${topicCategory || 'a business/service'}. Show ONLY imagery relevant to that specific product/service.
A dental ad = dental imagery. A real estate ad = architecture. A food ad = food. NOTHING religious unless holiday-tagged.`;
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

    // Media format-specific instructions
    const mediaFormatKey = mediaType || (aspectRatio === 'landscape' ? 'banner' : aspectRatio === 'portrait' ? 'ad' : 'social');
    const mediaFormatInstructions = MEDIA_FORMAT_INSTRUCTIONS[mediaFormatKey] || '';
    if (mediaFormatInstructions) {
      console.log(`[Pipeline] Applying media format instructions for: ${mediaFormatKey}`);
    }

    const visualOnlyPrompt = `Generate a VISUALLY STUNNING, AWARD-WINNING advertisement IMAGE with ABSOLUTELY ZERO TEXT AND ZERO LOGOS.

CRITICAL - NO TEXT, NO LOGOS:
- Do NOT render ANY letters, words, numbers, characters, or symbols in ANY language
- Do NOT write Hebrew, English, Arabic, or any other script
- Do NOT include phone numbers, headlines, watermarks, or captions
- Do NOT include ANY logo, emblem, brand mark, symbol, monogram, or seal — real or invented
- The brand logo and all text will be added in POST-PRODUCTION as a separate programmatic layer
- The image must be 100% VISUAL — only photography, illustration, colors, shapes, and composition
- ANY text or logo in the generated image is a CRITICAL ERROR

VISUAL IMPACT — MAKE IT EXTRAORDINARY (CRITICAL):
- Think CANNES LIONS, D&AD, ONE SHOW award-winning visual concepts
- Output must look like PREMIUM COMMERCIAL PHOTOGRAPHY, not clipart/illustration templates
- If the scene can be interpreted as an icon/illustration (e.g., tooth logo, generic symbol), REGENERATE as a real photographed scene
- Use BOLD, UNEXPECTED visual metaphors: surreal scale shifts, dramatic juxtaposition, impossible perspectives
- Create VISUAL TENSION: contrast between luxury and everyday, big and small, old and new
- Use CINEMATIC composition: dramatic angles (low angle hero shots, bird's eye, Dutch tilt), leading lines, rule of thirds with intent
- LIGHTING must be DRAMATIC: rim lighting, silhouettes, volumetric light rays, golden hour, neon glows, chiaroscuro
- Add DEPTH and DIMENSION: foreground elements framing the subject, atmospheric haze, layered planes of focus
- COLOR should be INTENTIONAL: complementary color schemes, monochromatic with one pop accent, rich saturated palettes
- Think EDITORIAL PHOTOGRAPHY meets FINE ART: every frame should feel like a gallery piece
- AVOID: flat compositions, centered subjects with no context, generic stock-photo poses, boring angles, plain backgrounds
- STRICTLY FORBIDDEN: vector icons, mascot-like drawings, infographic style, 2D clipart, logo-like symbols, medical stock templates

COMPOSITION FOR TEXT INTEGRATION (CRITICAL — FILL THE FRAME):
- The image must be VISUALLY FULL — NO large empty areas, NO excessive blank space
- Think MAGAZINE COVER: every inch of the frame contributes to the visual story
${headlinePosition === 'bottom' ? `
- TOP 80%: HERO VISUAL fills the frame with bold composition — subject large, dramatic, frame-filling
- BOTTOM 25%: Subtle organic darkening (shadow gradient, not a solid band) for contact info overlay
- BOTTOM-LEFT corner: Small clear space for brand logo
- The headline will overlay on top of the visual with text-shadow for contrast — the image behind MUST be interesting, not blank
` : headlinePosition === 'center' ? `
- FULL-FRAME visual with the hero subject LARGE and DOMINANT
- CENTER: A natural depth-of-field zone or atmospheric area where text can sit with contrast
- BOTTOM 12%: Thin contact strip area with organic darkening
- BOTTOM-LEFT corner: Small space for brand logo
` : `
- TOP-RIGHT 25%: Slightly darker atmospheric zone for headline text (NOT blank — use bokeh, gradient, atmospheric depth)
- The HERO VISUAL fills 85%+ of the frame — subject is LARGE, close-up, dramatic
- BOTTOM 12%: Thin organic shadow gradient for contact details
- BOTTOM-LEFT corner: Small clear space for brand logo
`}
- CRUCIAL: The visual must feel DENSE and RICH — like editorial photography, NOT a template with empty zones
- Use organic darkening at text zones: deep shadows, bokeh, atmospheric haze — NEVER solid color bands
- The subject should be CLOSE, LARGE, and COMMANDING — not tiny in the middle of empty space

${aspectInstruction}

VISUAL CONCEPT: ${effectiveVisualPrompt}
STYLE: ${styleDesc}
${templatePrompt ? `FORMAT: ${templatePrompt}` : ''}
${colorInstructions}
${holidayRules}

${brandContext?.pastMaterialsAnalysis?.length ? `
CLIENT'S PAST AD STYLE (CRITICAL — match this visual language!):
${brandContext.pastMaterialsAnalysis.map((a: any, i: number) => `Reference ${i+1}:
- Logo position: ${a.logoPosition || 'unknown'}
- Grid/layout: ${a.gridStructure || 'unknown'}
- Color palette: ${(a.colorPalette || []).join(', ') || 'unknown'}
- Typography style: ${a.typography || 'unknown'}
- Layout notes: ${a.layoutNotes || 'none'}`).join('\n')}

IMPORTANT: The generated image MUST follow the same visual structure, composition style, and layout patterns as the client's existing ads. Keep the same general "feel" — if their ads are clean and minimal, be clean and minimal. If they use bold colors and strong composition, do the same. Match the logo positioning and grid structure.
` : ''}

${brandContext ? `BRAND CONTEXT: "${brandContext.businessName || ''}" - ${brandContext.targetAudience || 'Haredi audience'}. ${brandContext.primaryXFactor ? `Differentiator: ${brandContext.primaryXFactor}` : ''}` : ''}
${brandContext?.businessPhotoUrls?.length ? `
CLIENT'S REAL BUSINESS/PRODUCT PHOTOS ARE AVAILABLE (${brandContext.businessPhotoUrls.length} photos). 
The AI should draw INSPIRATION from the real products/settings shown in these photos to create authentic visuals that match the client's actual business environment.` : ''}
${campaignContext ? `CAMPAIGN: "${campaignContext.offer || ''}" - Goal: ${campaignContext.goal || 'marketing'}${campaignContext.vibe ? `, Vibe: ${campaignContext.vibe}` : ''}` : ''}
${campaignContext?.campaignImageUrl ? `
A SPECIFIC CAMPAIGN IMAGE has been provided by the client. Use this image as the PRIMARY visual reference for the ad composition.` : ''}
${campaignContext?.adGoal ? `
AD GOAL (GUIDED BRIEF): "${campaignContext.adGoal}"
${campaignContext.adGoal === 'sell' ? '→ This is a SALES ad. Focus on product visibility, pricing emphasis, and urgency. Bold, energetic composition with warm contrasting colors.' : ''}
${campaignContext.adGoal === 'brand-presence' ? '→ This is a BRANDING ad. Premium, elegant, aspirational composition. Soft diffused lighting. Clean layout with generous white space. No prices.' : ''}
${campaignContext.adGoal === 'invite-contact' ? '→ This ad invites CONTACT/MEETING. Warm, welcoming, professional composition. Human connection emphasis. Contact details should be prominent.' : ''}
${campaignContext.adGoal === 'introduce-product' ? '→ This is a PRODUCT LAUNCH ad. Dramatic reveal composition. Theatrical lighting. Focus on ONE key element with sense of mystery and excitement.' : ''}` : ''}
${campaignContext?.emotionalTone ? `
EMOTIONAL TONE DIRECTIVE: "${campaignContext.emotionalTone}"
${campaignContext.emotionalTone === 'luxury' ? '→ Luxurious, elegant feel. Rich textures, gold accents, dramatic lighting. Premium materials and surfaces.' : ''}
${campaignContext.emotionalTone === 'urgency' ? '→ Urgent, time-sensitive feel. Bold red/orange accents, dynamic angles, high contrast. Energy and motion.' : ''}
${campaignContext.emotionalTone === 'belonging' ? '→ Warm belonging feel. Soft golden light, intimate compositions, family/community atmosphere.' : ''}
${campaignContext.emotionalTone === 'professional' ? '→ Professional, trustworthy feel. Clean lines, structured composition, neutral sophisticated palette.' : ''}` : ''}
${campaignContext?.priceOrBenefit ? `PRICE/BENEFIT TO HIGHLIGHT: "${campaignContext.priceOrBenefit}"` : ''}
${campaignContext?.isTimeLimited && campaignContext?.timeLimitText ? `TIME LIMIT: "${campaignContext.timeLimitText}" — add visual urgency cues.` : ''}
${campaignContext?.desiredAction ? `DESIRED CTA: "${campaignContext.desiredAction}" — composition should guide the eye toward this action.` : ''}
${!campaignContext?.adGoal && campaignContext?.goal === 'awareness' ? `
GOAL STYLE DIRECTIVE (awareness): Premium, elegant, aspirational composition. Soft diffused lighting. Clean layout with generous white space. Muted sophisticated color palette. No prices or discounts in the visual.` : 
!campaignContext?.adGoal && campaignContext?.goal === 'promotion' ? `
GOAL STYLE DIRECTIVE (promotion): Bold, energetic, eye-catching composition. Warm contrasting colors (red, orange, gold accents). Dynamic layout. Clear large text area for prices/offers. Sense of urgency.` :
!campaignContext?.adGoal && campaignContext?.goal === 'launch' ? `
GOAL STYLE DIRECTIVE (launch): Dramatic, surprising composition. Strong theatrical lighting with deep shadows. Unconventional camera angles. Shallow depth of field focusing on ONE key element. Sense of reveal and mystery.` :
!campaignContext?.adGoal && campaignContext?.goal === 'seasonal' ? `
GOAL STYLE DIRECTIVE (seasonal): Warm, festive, inviting composition. Golden hour warm lighting. Rich colors (gold, burgundy, deep green depending on holiday). Subtle seasonal elements in background. Warm family atmosphere.` : ''}

DESIGN APPROACH (CRITICAL):
${designApproach === 'brand-follower' ? `
DESIGN CONTINUITY MODE — BRAND FOLLOWER:
- You MUST replicate the EXACT same grid structure, layout composition, and visual language as the client's existing ads.
- Same positioning of elements: headline placement, logo position, contact bar, visual hero.
- Same style DNA: if their ads are clean/minimal → be clean/minimal. If bold/maximalist → match that.
- Think of this as creating the NEXT AD in an existing campaign series — seamless visual continuity.
- The viewer should NOT be able to tell if this ad was designed by a different designer.
` : designApproach === 'visual-refresh' ? `
DESIGN MODE — VISUAL REFRESH:
- Keep the SAME grid/layout structure as existing client ads (headline position, logo placement, contact bar location).
- BUT apply a FRESH visual style: new color treatment, new photographic approach, new typographic energy.
- Think: same skeleton, new skin. The structure is familiar but the aesthetics feel modern and renewed.
- Match all structural elements from past materials but make the visual execution feel elevated and current.
` : designApproach === 'structural-flex' ? `
DESIGN MODE — STRUCTURAL FLEXIBILITY:
- Preserve the brand DNA: use the brand colors, fonts, and visual identity faithfully.
- BUT feel free to create an entirely NEW grid/layout structure.
- Experiment with different headline positions, hero placements, and contact bar arrangements.
- The ad should feel like the same brand but presented in a completely different layout format.
` : designApproach === 'creative-freedom' ? `
DESIGN MODE — CREATIVE FREEDOM:
- FULL creative freedom — design from scratch with NO constraints from past materials.
- Create an entirely new visual identity for this specific campaign.
- Innovate on both structure AND style — surprise the viewer with unexpected composition and aesthetics.
- The only constraints are brand colors (if provided) and community rules.
` : ''}
${visualApproach === 'product-focus' ? `
- THIS IS A PRODUCT-FOCUSED visual. Show ONLY the product/service itself.
- For dental clinic → premium clinic interior, macro-quality dental instruments, high-end treatment context (NO tooth icons).
- ZERO people/characters. Focus entirely on the product/service with professional studio/editorial photography style.
- Clean background, premium lighting, hero product shot with believable realism.
` : visualApproach === 'lifestyle' ? `
- This concept MAY include ONE person (Orthodox Jewish man or boy in modest attire) if relevant to the message.
- Use cinematic lifestyle photography aesthetics, NEVER cartoon/illustration look.
- People are OPTIONAL, not mandatory. If the product doesn't need a person, don't force one.
` : `
- THIS IS A GRAPHIC-LED visual but still PREMIUM and realistic in finish.
- No clipart, no flat icon language, no template-like flyer graphics.
- Use advanced editorial composition, textured backgrounds, refined geometric systems, and luxury brand art direction.
- Keep it modern, bold, and high-end — not old-school coupon/flyer design.
`}
- Do NOT force holiday elements unless the campaign is specifically about that holiday
- Focus on the PRODUCT/SERVICE itself, not generic "Haredi scenes"
- Professional, modern, clean design that happens to be for a Haredi audience — not "Haredi-themed" by default

COMMUNITY RULES:
- This targets the Haredi (Ultra-Orthodox) Jewish community
- ABSOLUTELY NO women or girls in images
- If people ARE needed: men/boys in modest Orthodox attire only
- Clean, premium, professional

CRITICAL — GENDER-VISUAL MATCHING (IRON RULE):
- If the campaign copy/offer targets WOMEN (feminine language: את, שלך, מגיע לך, מושלמת, הרגישי) or the product is FOR WOMEN (facial treatments for women, women's fashion, wigs/sheitels, cosmetics, dresses):
  → DO NOT show ANY male figures (no bearded men, no boys, no male characters)
  → Use ONLY: product photography, graphic design, abstract elements, feminine aesthetics (flowers, spa elements, creams, fabrics)
  → A man with a beard in an ad for women's facial treatments is a CATASTROPHIC ERROR
- If the campaign copy targets MEN (masculine language: אתה, שלך, אבא):
  → Male figures are appropriate
  → Do NOT use feminine product imagery
- WHEN IN DOUBT: Use pure product/graphic design with NO people at all. This is ALWAYS safe.

${sectorInsights}
${modelRules}

${corrections?.length ? `
CLIENT REVISION NOTES (IMPORTANT — apply these changes to improve the design):
${corrections.map((c: any) => `- [${c.type === 'copy' ? 'TEXT' : c.type === 'visual' ? 'VISUAL' : 'GENERAL'}]: ${c.text}`).join('\n')}
Incorporate ALL these corrections into the new design.
` : ''}

Remember: ZERO text. Pure visual design only. Beautiful composition with empty areas for text overlay.`;

    const engineVersion = engine === 'nano-banana-pro' ? 'nano-banana-pro' : 'nano-banana';
    console.log(`[Pipeline] Starting Layer 1 - Visual generation (engine: ${engineVersion})`);
    const visualResult = await generateVisualLayer(visualOnlyPrompt, brandContext, LOVABLE_API_KEY, engineVersion, campaignContext);
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
    const rawHeadline = textPrompt || campaignContext?.offer || '';
    const businessName = brandContext?.businessName || '';
    
    // Extract contact details: prefer brand context, then try past_materials analysis
    let phone = brandContext?.contactPhone || '';
    let email = brandContext?.contactEmail || '';
    let address = brandContext?.contactAddress || '';
    
    // If no contact details in brand context, try to extract from past materials analysis
    if (brandContext?.pastMaterialsAnalysis?.length) {
      for (const analysis of brandContext.pastMaterialsAnalysis) {
        if (!phone && analysis.extractedPhone) phone = analysis.extractedPhone;
        if (!email && analysis.extractedEmail) email = analysis.extractedEmail;
        if (!address && analysis.extractedAddress) address = analysis.extractedAddress;
        if (analysis.contactInfo) {
          if (!phone && analysis.contactInfo.phone) phone = analysis.contactInfo.phone;
          if (!email && analysis.contactInfo.email) email = analysis.contactInfo.email;
          if (!address && analysis.contactInfo.address) address = analysis.contactInfo.address;
        }
      }
    }
    
    // === HEADLINE: Generate a creative, punchy marketing headline via AI ===
    let headline = '';
    const offerText = campaignContext?.offer || textPrompt || '';
    
    if (offerText && LOVABLE_API_KEY) {
      try {
        console.log('[Headline AI] Generating creative headline from offer:', offerText.slice(0, 100));
        const headlineResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            max_completion_tokens: 40,
            messages: [
              {
                role: 'system',
                content: 'אתה קופירייטר פרסומי מבריק. תפקידך ליצור כותרת ראשית קצרה ועוצמתית (3-6 מילים בלבד) למודעה. הכותרת חייבת להיות קריאייטיבית, שיווקית, מושכת ומעוררת סקרנות. אל תעתיק את הבריף — תמצה אותו למסר פרסומי חד. ללא גרשיים, ללא סימני פיסוק. תחזיר רק את הכותרת עצמה.'
              },
              {
                role: 'user',
                content: `בריף: ${offerText.slice(0, 300)}\nשם העסק: ${businessName}\nמטרה: ${campaignContext?.adGoal || ''}\nטון: ${campaignContext?.emotionalTone || ''}`
              }
            ],
          }),
        });
        if (headlineResponse.ok) {
          const headlineData = await headlineResponse.json();
          const aiHeadline = headlineData.choices?.[0]?.message?.content?.trim();
          if (aiHeadline && aiHeadline.length > 2 && aiHeadline.length <= 40) {
            headline = aiHeadline.replace(/["""''`.!?]/g, '').trim();
            console.log('[Headline AI] Generated:', headline);
          }
        }
      } catch (headlineError) {
        console.error('[Headline AI] Error:', headlineError);
      }
    }
    
    // Fallback: use buildCreativeHeadline if AI failed
    if (!headline) {
      headline = buildCreativeHeadline(rawHeadline, campaignContext, topicCategory);
    }
    
    const secondaryLines = buildSecondaryLines(campaignContext?.offer || textPrompt || '', businessName);
    const bodyText = ''; // IRON RULE: bodyText never rendered
    
    // Map desiredAction from guided brief → Hebrew CTA text
    const CTA_MAP: Record<string, string> = {
      'whatsapp-email': 'שלחו הודעה עכשיו',
      'phone-call': 'חייגו עכשיו',
      'visit-store': 'בואו לבקר',
      'visit-website': 'לפרטים נוספים',
      'remember-me': '',
    };
    const primaryAction = Array.isArray(campaignContext?.desiredActions) 
      ? campaignContext.desiredActions[0] 
      : campaignContext?.desiredAction;
    const ctaText = primaryAction ? (CTA_MAP[primaryAction] || '') : '';
    
    // === SUBTITLE: descriptive text about the business/service (smaller, under headline) ===
    // Use AI to generate a short descriptive subtitle from the brief
    let subtitle = '';
    if (campaignContext?.offer && LOVABLE_API_KEY) {
      try {
        console.log('[Subtitle AI] Generating subtitle from offer:', campaignContext.offer.slice(0, 100));
        const subtitleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            max_completion_tokens: 60,
            messages: [
              {
                role: 'system',
                content: 'אתה קופירייטר פרסומי. תפקידך ליצור כותרת משנה תיאורית קצרה (עד 8 מילים) למודעה. הכותרת צריכה לתאר את השירות או ההזמנה בצורה ישירה ומקצועית. למשל: "מזמינה אתכם לחוויית טיפול" או "מומחים לטיפולי פנים מתקדמים". ללא גרשיים, ללא סימני פיסוק. תחזיר רק את הכותרת עצמה.'
              },
              {
                role: 'user',
                content: `בריף: ${campaignContext.offer.slice(0, 300)}\nשם העסק: ${businessName}\nמטרה: ${campaignContext?.adGoal || ''}`
              }
            ],
          }),
        });
        if (subtitleResponse.ok) {
          const subtitleData = await subtitleResponse.json();
          const aiSubtitle = subtitleData.choices?.[0]?.message?.content?.trim();
          if (aiSubtitle && aiSubtitle.length > 3 && aiSubtitle.length <= 56) {
            subtitle = aiSubtitle.replace(/["""''`]/g, '').slice(0, 56);
            console.log('[Subtitle AI] Generated:', subtitle);
          }
        }
      } catch (subtitleError) {
        console.error('[Subtitle AI] Error:', subtitleError);
      }
    }
    
    // Fallback subtitles
    if (!subtitle && brandContext?.winningFeature) {
      subtitle = brandContext.winningFeature.slice(0, 56);
    } else if (!subtitle && brandContext?.primaryXFactor) {
      subtitle = brandContext.primaryXFactor.slice(0, 56);
    }
    console.log('[TextMeta] headline:', headline, '| subtitle:', subtitle, '| ctaText:', ctaText);
    
    // Extract services list from campaign context, offer text, or x-factors
    let servicesList: string[] = campaignContext?.services || [];
    
    // Auto-extract services/treatments from the offer brief if none provided
    if (!servicesList.length && campaignContext?.offer) {
      const offerText = campaignContext.offer;
      // Look for treatment/service names (Hebrew patterns)
      const treatmentPatterns = offerText.match(/(?:בוטוקס|סקין בוסטר|מיקרונידלינג|עיצוב שפתיים|חומצה היאלורונית|אסטפיל|ביוסטימולטור|פולינוקלאוטידים|טיפולי?[ם]?\s+[\u0590-\u05FF]+|חבילת\s+[\w\s]+)/gi) || [];
      if (treatmentPatterns.length > 0) {
        servicesList = [...new Set(treatmentPatterns.map(t => t.trim()))].slice(0, 5);
      }
    }
    
    if (!servicesList.length && brandContext?.xFactors?.length) {
      servicesList = brandContext.xFactors.slice(0, 5);
    }
    
    // Auto-extract promo info: prioritize guided brief fields over auto-extraction
    let promoText = campaignContext?.promoText || '';
    let promoValue = campaignContext?.priceOrBenefit || campaignContext?.promoValue || '';
    
    // If there's a time limit, use it as promo text
    if (!promoText && campaignContext?.isTimeLimited && campaignContext?.timeLimitText) {
      promoText = campaignContext.timeLimitText;
    }
    
    // If there's a price/benefit but no promoText, use it as promo badge text
    if (!promoText && promoValue) {
      promoText = promoValue;
    }
    
    // Auto-extract bullet items (services, prices, advantages) from the brief
    const bulletItems: { icon: string; text: string; highlight?: boolean }[] = [];
    
    if (campaignContext?.offer) {
      const offerText = campaignContext.offer;
      
      // Extract discount percentages
      const discountMatch = offerText.match(/(\d{1,3}%\s*הנחה(?:\s+על\s+[\u0590-\u05FF\s]+)?)/);
      if (discountMatch) {
        promoValue = discountMatch[1].trim();
      }
      // Extract price mentions
      const priceMatch = offerText.match(/(\d{3,5})\s*(?:ש"ח|₪)/);
      if (priceMatch && !promoValue) {
        promoValue = `מ-${priceMatch[1]} ₪`;
      }
      
      // 1. Extract package deals with prices (e.g., "חבילת skin glow ... 3490 ש"ח")
      const packageRegex = /חבילת\s+([^\n-–]+?)[\s-–]*(\d{3,5})\s*(?:ש"ח|₪)/gi;
      let pkgMatch;
      while ((pkgMatch = packageRegex.exec(offerText)) !== null && bulletItems.length < 6) {
        bulletItems.push({ icon: '🏷️', text: `${pkgMatch[1].trim()} - ${pkgMatch[2]} ₪`, highlight: true });
      }
      
      // 2. Extract discount lines (e.g., "10% הנחה על בוטוקס")
      const discountRegex = /(\d{1,3}%\s*הנחה\s+על\s+[^\n,]+)/gi;
      let discMatch;
      while ((discMatch = discountRegex.exec(offerText)) !== null && bulletItems.length < 6) {
        bulletItems.push({ icon: '🔥', text: discMatch[1].trim() });
      }
      
      // 3. Extract USP / advantage phrases
      const uspPhrases = offerText.match(/(?:רופאה[^.!,\n]*|לא קוסמטיקאית[^.!,\n]*|אבחון רפואי[^.!,\n]*|התאמה אישית[^.!,\n]*|מראה טבעי[^.!,\n]*)/gi);
      if (uspPhrases) {
        for (const usp of uspPhrases.slice(0, 3)) {
          if (bulletItems.length >= 6) break;
          bulletItems.push({ icon: '⭐', text: usp.trim().slice(0, 40) });
        }
      }
      
      // 4. Extract specific treatment/service names as bullets if we have room
      if (bulletItems.length < 4 && servicesList.length > 0) {
        for (const svc of servicesList.slice(0, 4 - bulletItems.length)) {
          bulletItems.push({ icon: '✓', text: svc });
        }
      }
    } else if (!promoText && !promoValue) {
      // No offer text, skip promo extraction
    }

    return new Response(JSON.stringify({ 
      imageUrl: visualResult.imageUrl,
      visualOnlyUrl: visualResult.imageUrl,
      textMeta: {
        headline,
        subtitle,
        bodyText,
        ctaText,
        businessName,
        phone,
        email,
        address,
        servicesList,
        promoText,
        promoValue,
        bulletItems: bulletItems.length > 0 ? bulletItems : undefined,
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
