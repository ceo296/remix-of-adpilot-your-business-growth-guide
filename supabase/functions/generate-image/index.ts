import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchAgentPrompt(agentKey: string, fallback: string): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await supabase.from('agent_prompts').select('system_prompt').eq('agent_key', agentKey).maybeSingle();
    if (data?.system_prompt) {
      console.log(`[${agentKey}] Loaded dynamic prompt from DB (${data.system_prompt.length} chars)`);
      return data.system_prompt;
    }
    console.log(`[${agentKey}] No DB prompt found, using fallback`);
    return fallback;
  } catch (e) {
    console.error(`[${agentKey}] Failed to fetch prompt:`, e);
    return fallback;
  }
}

// Enhanced style descriptions for better quality
const DEFAULT_ART_DIRECTOR_GUIDELINES = `
[CORE MISSION] You are a world-class Advertising Art Director specializing in high-end luxury brands for the Haredi (Ultra-Orthodox) Jewish sector. Your goal is to generate ONE complete, ready-to-publish advertisement with BOTH stunning visuals AND professional Hebrew typography — all composed together as a single cohesive masterpiece.

[VISUAL STYLE - MANDATORY]
NO COLLAGES: Never create split screens, grids, or multiple separate images in one frame.
CINEMATIC QUALITY: Use 35mm or 50mm lens aesthetics with shallow depth of field.
LIGHTING: Professional "Golden Hour" or soft studio lighting.
TEXTURE: High detail on materials (wood grain, fabric texture, skin pores).

[HEBREW TYPOGRAPHY - CRITICAL]
ALL TEXT must be in HEBREW, reading RIGHT-TO-LEFT.
Every Hebrew letter must be in correct order — NOT mirrored, reversed, or scrambled.
Use BOLD, CLEAN, professional Hebrew fonts — sharp, crisp, perfectly readable.
Headlines: LARGE and dominant, the first thing the eye sees.
Contact details: organized in the bottom contact strip, phone numbers LARGE and clear.

[HAREDI AUTHENTICITY]
PEOPLE: Men only — dark suits, white shirts, kippot, neatly groomed beards.
ABSOLUTELY NO women or girls in any image.
ENVIRONMENT: Upscale, clean, prestigious settings.

[AD GRID — 3 AREAS (describe layout, NEVER render these labels as visible text!)]
TOP AREA — HEADLINE (top 15-20%): Bold Hebrew headline + subtitle
CENTER AREA — HERO VISUAL (center 55-65%): Cinematic product/lifestyle photography
BOTTOM AREA — CONTACT STRIP (bottom 15-25%): Dark/branded bar with logo (LEFT), phone, address, branches (RIGHT)

⚠️ CRITICAL: The words "ZONE", "ZONE 1", "ZONE 2", "ZONE 3", "TOP AREA", "CENTER AREA", "BOTTOM AREA" are INTERNAL LAYOUT INSTRUCTIONS ONLY. They must NEVER appear as visible text anywhere in the generated image! If you render any of these labels in the image, the ad is RUINED.

[VISUAL QA]
- Children: smooth faces, NO facial hair. Hands: exactly 5 fingers.
- Food: appetizing, realistic. Eyes: symmetrical.
- SELF-CHECK: "Does anything look uncanny or deformed?" If yes — regenerate.
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

// Engine version → model mapping (Nano Banana 2 only, no fallback to inferior models)
const ENGINE_MODELS: Record<string, string[]> = {
  'nano-banana-pro': ['google/gemini-3.1-flash-image-preview'],
  'nano-banana': ['google/gemini-3.1-flash-image-preview'],
};

// ───── All-in-One image generation (visual + text + logo in single call) ─────
async function generateVisualLayer(
  fullPrompt: string,
  brandContext: any,
  LOVABLE_API_KEY: string,
  engineVersion: string = 'nano-banana-pro',
  campaignContext?: any,
  sourceImageUrl?: string
): Promise<{ imageUrl: string; model: string }> {
  const models = ENGINE_MODELS[engineVersion] || ENGINE_MODELS['nano-banana-pro'];

  const ART_DIRECTOR_GUIDELINES = await fetchAgentPrompt('generate-image', DEFAULT_ART_DIRECTOR_GUIDELINES);
  const messageContent: any[] = [{ type: "text", text: ART_DIRECTOR_GUIDELINES + "\n\n" + fullPrompt }];
  const normalizedSourceImageUrl = typeof sourceImageUrl === 'string' ? sourceImageUrl.trim() : '';
  const isRevisionMode = !!normalizedSourceImageUrl && !normalizedSourceImageUrl.startsWith('data:application/pdf');

  if (isRevisionMode) {
    console.log("Including SOURCE AD image for targeted revision:", normalizedSourceImageUrl.substring(0, 80));
    messageContent.push({
      type: "image_url",
      image_url: { url: normalizedSourceImageUrl }
    });
    // In revision mode, REPLACE the entire prompt with a minimal, focused revision prompt
    // This prevents the AI from being overwhelmed by the full creative brief and generating new concepts
    // ═══ TARGETED REVISION: Parse corrections to determine what's locked ═══
    const correctionText = fullPrompt.match(/CLIENT REVISIONS:\n([\s\S]*?)(?:\n\n|FINAL CHECKLIST)/)?.[1] || '';
    const correctionsLower = correctionText.toLowerCase();
    const isHeadlineChangeRequested = /headline|כותרת ראשית|כותרת/i.test(correctionText) && !/כותרת משנה/i.test(correctionText);
    const isSubtitleChangeRequested = /subtitle|כותרת משנה/i.test(correctionText);
    const isContactChangeRequested = /phone|טלפון|כתובת|address|contact|פרטים טכניים/i.test(correctionText);

    messageContent[0].text = `
════════════════════════════════════════════════════════════════════
         ⚠️  TARGETED REVISION MODE — THIS IS NOT A NEW AD  ⚠️
════════════════════════════════════════════════════════════════════

You are receiving an EXISTING advertisement that needs SMALL CORRECTIONS.

🔒 LOCKED (DO NOT CHANGE — ANY CHANGE TO THESE IS A CRITICAL ERROR):
- The overall composition, layout, and grid structure
- The logo (keep EXACTLY as it appears — do NOT redraw, replace, or invent a new logo)
- The color palette and brand identity
- The visual style and photography
${!isHeadlineChangeRequested ? '- ❗ The HEADLINE TEXT — keep the EXACT SAME headline text, word for word. The client did NOT ask to change the headline.' : ''}
${!isSubtitleChangeRequested ? '- ❗ The SUBTITLE TEXT — keep the EXACT SAME subtitle, word for word. The client did NOT ask to change the subtitle.' : ''}
${!isContactChangeRequested ? '- The contact details strip — keep phone, address, branches EXACTLY as shown' : ''}
- Any elements NOT mentioned in the corrections below

✏️ CORRECTIONS TO APPLY (ONLY THESE — NOTHING ELSE):
${correctionText || '(see below)'}

📐 RULES:
1. Output exactly ONE corrected version of this ad
2. Keep 95%+ of the image IDENTICAL — only change what's requested above
3. All Hebrew text must be RIGHT-TO-LEFT, sharp, and fully readable
4. No text may be clipped, cut off, or extend beyond edges (keep 5% safety margin)
5. Do NOT generate a new concept, new layout, or new visual approach
6. Do NOT invent, redraw, or modify the logo — keep it EXACTLY as shown
7. The corrected ad must look like a MINOR EDIT of the original, not a redesign
8. CONTACT STRIP: Every character must be a real, readable Hebrew letter or digit. NO gibberish, garbled text, random dots, or placeholder symbols. If unsure of a character — OMIT IT entirely rather than render garbage.

${fullPrompt.match(/═══ HEBREW TEXT TO INCLUDE[\s\S]*?═══════════════════════════════════════════════════════════════════/)?.[0] || ''}

GENERATE THE CORRECTED AD NOW.
════════════════════════════════════════════════════════════════════
`;
  }

  // ═══ PAST MATERIALS as visual references (HIGHEST priority for brand-follower/visual-refresh) ═══
  const pastMaterialUrls = brandContext?.pastMaterialUrls || [];
  const designApproach = brandContext?.designApproach;
  const shouldUsePastMaterials = pastMaterialUrls.length > 0 && 
    (designApproach === 'brand-follower' || designApproach === 'visual-refresh');
  
  if (!isRevisionMode && shouldUsePastMaterials) {
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
  if (!isRevisionMode && campaignImageUrl && !campaignImageUrl.startsWith('data:application/pdf')) {
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
  if (!isRevisionMode) {
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
  }

  // Include design reference (specific past material selected by user)
  const designRefUrl = brandContext?.designReference?.url;
  if (!isRevisionMode && designRefUrl && typeof designRefUrl === 'string' && !designRefUrl.startsWith('data:application/pdf')) {
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

  // ALL-IN-ONE: Include the logo as a reference image so the AI places it naturally in the composition
  // In REVISION MODE: do NOT attach the logo separately — it's already in the source image
  const logoUrl = brandContext?.logoUrl;
  if (isRevisionMode) {
    // Revision mode: logo is already in the source ad, just remind the AI not to touch it
    messageContent[0].text = `REVISION LOGO RULE: The source ad already contains the correct brand logo. Keep it EXACTLY as-is. Do NOT replace, redraw, invent, or remove the logo.\n\n` + messageContent[0].text;
  } else if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('data:application/pdf')) {
    console.log("Including BRAND LOGO as reference for All-in-One composition:", logoUrl.substring(0, 80));
    messageContent.push({
      type: "image_url",
      image_url: { url: logoUrl }
    });
    messageContent[0].text = `
═══ BRAND LOGO ATTACHED — USE IT EXACTLY AS-IS ═══
The client's ACTUAL brand logo is attached as the LAST image.
- Place this EXACT logo prominently in the BOTTOM-LEFT area of the contact strip
- The logo should be 15-25% of ad width — clearly visible and prominent
- Keep in ORIGINAL colors — do NOT modify, recolor, or redesign it
- Do NOT invent a new logo — use ONLY this attached image
═══════════════════════════════════════════════════
\n\n` + messageContent[0].text;
  } else {
    messageContent[0].text = `LOGO NOTE: No logo was provided. Leave the bottom-left corner of the contact strip clean for later logo placement. Do NOT invent any logo.\n\n` + messageContent[0].text;
  }

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  for (const tryModel of models) {
    console.log(`[All-in-One] Trying model: ${tryModel} (attempt ${attempt + 1}/${MAX_RETRIES})`);
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
        console.log("[All-in-One] Success with model:", tryModel);
        return { imageUrl, model: tryModel };
      }
      // Model returned OK but no image — log details and retry
      const textContent = data.choices?.[0]?.message?.content || '(no text)';
      console.error(`[All-in-One] No image in response from ${tryModel}. Text: ${textContent.substring(0, 200)}`);
      console.log("[All-in-One] Retrying after no-image response...");
      await new Promise(r => setTimeout(r, 2000));
      continue;
    } else {
      const status = response.status;
      const errorText = await response.text();
      console.error(`[All-in-One] ${tryModel} error:`, status, errorText);

      if (status === 429) throw { status: 429, message: "הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות." };
      if (status === 402) throw { status: 402, message: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." };

      if (status === 500 && tryModel !== models[models.length - 1]) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }
  } // end models loop
  } // end retry loop
  throw { status: 500, message: "שגיאה ביצירת השכבה הויזואלית. נסה שוב." };
}

// Layer 2 removed — All-in-One architecture generates complete ads in a single call

function normalizePromptText(value: string): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

type NormalizedCorrection = { type: string; text: string };

function normalizeCorrections(rawCorrections: any): NormalizedCorrection[] {
  if (!Array.isArray(rawCorrections)) return [];

  return rawCorrections
    .map((item): NormalizedCorrection => {
      if (typeof item === 'string') {
        return { type: 'general', text: normalizePromptText(item) };
      }

      if (item && typeof item === 'object') {
        const type = typeof item.type === 'string' && item.type.trim() ? item.type.trim() : 'general';
        const text = typeof item.text === 'string'
          ? normalizePromptText(item.text)
          : typeof item.note === 'string'
            ? normalizePromptText(item.note)
            : '';

        return { type, text };
      }

      return { type: 'general', text: '' };
    })
    .filter((item) => item.text.length > 0);
}

const TOPIC_INFERENCE_RULES: Record<string, RegExp> = {
  food: /(אלכוהול|יין|יינות|וויסקי|ו(?:ו|ד)דקה|ליקר|ליקרים|בירה|בירות|משקה|משקאות|פיצוחים|סופר|מכולת|מעדניה)/i,
  real_estate: /(נדל"?ן|דירה|דירות|דיור|משכנתא|פרויקט|תיווך)/i,
  health: /(רפואה|רפואי|רופא|מרפאה|שיניים|טיפול|אורתודונט|קליניקה)/i,
  beauty: /(קוסמטיקה|טיפוח|עור|פנים|איפור|ספא|פאה|פאות)/i,
  education: /(חינוך|לימוד|ישיבה|סמינר|בית ספר|קורס|חוג)/i,
};

const NIGHTLIFE_HEADLINE_PATTERNS: RegExp[] = [
  /תפתח\s+מועדון/i,
  /חיי\s*לילה/i,
  /מסיבה/i,
  /פאב/i,
  /צ[׳']?ייסר/i,
  /שוטים?/i,
  /תמ(?:לא|זוג|רים).{0,12}כוס/i,
];

function inferTopicCategoryFromText(input: string): string | null {
  const text = normalizePromptText(input).toLowerCase();
  if (!text) return null;

  for (const [topic, regex] of Object.entries(TOPIC_INFERENCE_RULES)) {
    if (regex.test(text)) return topic;
  }

  return null;
}

function getVariationDirective(variationIndex?: number): string {
  const directives = [
    'כיוון וריאציה: הדגשת מוצר/שירות בתקריב נקי עם מסר חד וקצר.',
    'כיוון וריאציה: סצנת שימוש יומיומית אותנטית ומכובדת, עם זווית צילום שונה מהסקיצה הקודמת.',
    'כיוון וריאציה: קומפוזיציה טיפוגרפית-גרפית נועזת עם ויזואל מינימלי.',
    'כיוון וריאציה: פריסת פרימיום מאוזנת עם היררכיה שונה וכותרת בזווית רעיונית חדשה.',
  ];

  const index = Number.isFinite(variationIndex)
    ? Math.abs(Math.trunc(variationIndex as number)) % directives.length
    : 0;

  return directives[index];
}

function isHeadlineSafeForAudience(headline: string, contextText: string): boolean {
  const normalizedHeadline = normalizePromptText(headline);
  if (!normalizedHeadline) return false;

  const normalizedContext = normalizePromptText(contextText);
  const hasLoyaltyClubContext = /(מועדון\s*לקוחות|כרטיס\s*הטבות|הטבות|נקודות)/i.test(normalizedContext);

  if (!hasLoyaltyClubContext && /מועדון/i.test(normalizedHeadline)) {
    return false;
  }

  if (NIGHTLIFE_HEADLINE_PATTERNS.some((pattern) => pattern.test(normalizedHeadline))) {
    return false;
  }

  return true;
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

    const body = await req.json();
    const { visualPrompt, textPrompt, style, engine, templateId, templateHints, dimensions, brandContext, campaignContext, mediaType, topicCategory, holidaySeason, aspectRatio, visualApproach, designApproach, corrections, variationIndex, headlinePosition, _visualOnlyUrl, sourceImageUrl } = body;
    const revisionSourceImageUrl = sourceImageUrl || _visualOnlyUrl || null;
    const normalizedCorrections = normalizeCorrections(corrections);
    const inferredTopicCategory = inferTopicCategoryFromText([
      visualPrompt,
      textPrompt,
      campaignContext?.offer,
      campaignContext?.title,
      brandContext?.winningFeature,
      Array.isArray(brandContext?.services) ? brandContext.services.join(' ') : '',
    ].filter(Boolean).join(' '));
    const effectiveTopicCategory = topicCategory || inferredTopicCategory;

    console.log("Received request:", { visualPrompt, textPrompt, style, engine, templateId, mediaType, topicCategory, holidaySeason, aspectRatio, headlinePosition, hasRevisionSource: !!revisionSourceImageUrl, brandContext: brandContext ? { businessName: brandContext.businessName, colors: brandContext.colors, logoUrl: !!brandContext.logoUrl } : null, corrections: normalizedCorrections.length });
    console.log('[Topic Detection] requested:', topicCategory, '| inferred:', inferredTopicCategory, '| effective:', effectiveTopicCategory);

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
      .is('topic_category', null)
      .limit(30);
    if (effectiveTopicCategory) {
      sectorQuery = supabase
        .from('sector_brain_examples')
        .select('zone, name, text_content, stream_type, gender_audience, topic_category')
        .or(`topic_category.eq.${effectiveTopicCategory},topic_category.is.null`)
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
    const rawVisualPrompt = visualPrompt || campaignContext?.offer || brandContext?.winningFeature || 'עיצוב פרסומי מקצועי';
    // Sanitize placeholder phones from AI-generated visual prompts
    const effectiveVisualPrompt = rawVisualPrompt.replace(/0[2-9]X?[-\s]?X{3,7}/gi, '').replace(/05\d[-\s]?\d{7}/g, brandContext?.contactPhone || '').trim() || 'עיצוב פרסומי מקצועי';
    
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
    } else if (!holidaySeason || holidaySeason === 'year_round' || holidaySeason === '') {
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

        These objects are ONLY relevant for holiday-specific campaigns. Including them in a ${effectiveTopicCategory || 'commercial'} ad is like putting a Christmas tree in a summer ad — a CATASTROPHIC professional error.

        The ad is for: ${effectiveTopicCategory || 'a business/service'}. Show ONLY imagery relevant to that specific product/service.
A dental ad = dental imagery. A real estate ad = architecture. A food ad = food. NOTHING religious unless holiday-tagged.`;
    }

    // ═══════════════════════════════════════════
    // ALL-IN-ONE: Complete ad with text, logo, and layout in a single AI call
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

    // ═══ STEP 1: Generate headline + subtitle via fast text model ═══
    const rawHeadline = textPrompt || campaignContext?.offer || '';
    const businessName = brandContext?.businessName || '';
    const honorific = brandContext?.honorificPreference || 'neutral';
    const genderDirective = honorific === 'mr' 
      ? 'פנה בלשון זכר יחיד בלבד (אתה, שלך). אסור לשון נקבה או רבים.'
      : honorific === 'mrs' 
      ? 'פני בלשון נקבה יחיד בלבד (את, שלך). אסור לשון זכר או רבים.'
      : 'פנה בלשון רבים (אתם, שלכם). אסור לשון יחיד.';
    const brandServices = brandContext?.services?.length ? brandContext.services.join(', ') : '';
    const brandXFactor = brandContext?.primaryXFactor || brandContext?.winningFeature || '';
    const offerTextForAI = campaignContext?.offer || textPrompt || '';
    const variationDirective = revisionSourceImageUrl
      ? 'תיקון ממוקד בלבד — שמירה על אותה סקיצה.'
      : getVariationDirective(variationIndex);
    const headlineValidationContext = [offerTextForAI, campaignContext?.goal, campaignContext?.adGoal, brandServices].filter(Boolean).join(' | ');
    
    // Generate headline + subtitle in parallel
    let headline = '';
    let subtitle = '';
    
    // ═══ ANTI-BANALITY ENGINE: Generate 3 candidates, reject clichés, pick best ═══
    const CLICHE_PATTERNS = [
      /הכי טוב/i, /מקצועי ואיכותי/i, /שירות מעולה/i, /פתרון מושלם/i,
      /הבחירה הנכונה/i, /חווי[ית]ה? (שלא |בלתי )?נשכח/i, /מומחים ב/i,
      /שנות ניסיון/i, /באיכות ללא פשרות/i, /הפתרון שלך/i, /מובילים ב/i,
      /הכתובת שלך ל/i, /עולם של/i, /חוויה ייחודית/i, /ברמה אחרת/i,
      /מהיום הכל/i, /שירות ברמה/i, /איכות ללא/i, /המקום שבו/i,
      /בואו להכיר/i, /הזדמנות שלא/i, /אל תפספסו/i, /רק אצלנו/i,
    ];

    function isCliche(text: string): boolean {
      return CLICHE_PATTERNS.some(p => p.test(text));
    }

    if (offerTextForAI && LOVABLE_API_KEY) {
      const headlineSystemPrompt = `אתה קופירייטר בכיר — פורץ דרך, שנון, בלתי נשכח.
תפקידך ליצור 3 כותרות מועמדות למודעה (3-6 מילים כל אחת), כל אחת בשורה נפרדת.

כללי ברזל:
1. כל כותרת חייבת להיות שונה לחלוטין בזווית — אסור 3 וריאציות על אותו רעיון
2. כותרת 1: טוויסט או משחק מילים חכם
3. כותרת 2: מטאפורה או דימוי ויזואלי
4. כותרת 3: ניגוד, פרובוקציה, או שאלה רטורית חדה
5. אסור קלישאות: "הכי טוב", "מקצועי ואיכותי", "שירות מעולה", "פתרון מושלם", "חוויה ייחודית", "ברמה אחרת", "באיכות ללא פשרות", "הבחירה הנכונה", "הזדמנות שלא חוזרת"
6. אסור סימני פיסוק (פסיקים, נקודות). אסור גרשיים. אסור מספרים
7. עדיף לא לכלול את שם העסק — הוא בלוגו
8. לקהל חרדי: אסור סלנג לילה/ברים/מועדונים
9. תחזיר רק 3 כותרות — כל אחת בשורה נפרדת, בלי מספור, בלי הסברים

דוגמאות לכותרות חזקות:
- נדל"ן: "חלון שמתגשם" (טוויסט על "חלום")
- שיניים: "הפה שלך. הבמה שלנו"
- מזון: "טעם שלא שוכחים"
- אופנה: "הבגד עושה את הגבר"

כלל מגדרי קריטי: ${genderDirective}`;

      const headlineUserContent = `בריף מלא: ${offerTextForAI.slice(0, 800)}\nשם העסק: ${businessName}\nמטרה: ${campaignContext?.adGoal || ''}\nטון: ${campaignContext?.emotionalTone || ''}\nבידול: ${brandXFactor}\nשירותים: ${brandServices}\nפעולה רצויה: ${campaignContext?.desiredAction || campaignContext?.desiredActions?.[0] || ''}\nוריאציה נדרשת: ${variationDirective}\n${campaignContext?.priceOrBenefit ? `מחיר/הטבה: ${campaignContext.priceOrBenefit}` : ''}\n${campaignContext?.timeLimitText ? `מוגבל בזמן: ${campaignContext.timeLimitText}` : ''}`;

      const headlinePromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          max_completion_tokens: 120,
          messages: [
            { role: 'system', content: headlineSystemPrompt },
            { role: 'user', content: headlineUserContent }
          ],
        }),
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const subtitlePromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          max_completion_tokens: 60,
          messages: [
            { role: 'system', content: `אתה קופירייטר פרסומי. תפקידך ליצור כותרת משנה תיאורית קצרה (5-10 מילים) למודעה.

כללי ברזל:
1. כותרת המשנה חייבת להישמע כמו סלוגן חד — לא כמו משפט מהבריף
2. קרא את כל הבריף — חפש הטבות, מבצעים, מחירים ותמצת אותם בחדות
3. ללא גרשיים. תחזיר רק את הכותרת עצמה
4. אם יש מחיר/הטבה ספציפית בבריף — שלב אותה בכותרת המשנה
5. אסור ניסוחים של חיי לילה/אלכוהול פרוע/מועדונים

כלל מגדרי קריטי: ${genderDirective}` },
            { role: 'user', content: `בריף מלא: ${offerTextForAI.slice(0, 800)}\nשם העסק: ${businessName}\nמטרה: ${campaignContext?.adGoal || ''}\nבידול: ${brandXFactor}\nשירותים: ${brandServices}\nוריאציה נדרשת: ${variationDirective}\n${campaignContext?.priceOrBenefit ? `מחיר/הטבה: ${campaignContext.priceOrBenefit}` : ''}\n${campaignContext?.timeLimitText ? `מוגבל בזמן: ${campaignContext.timeLimitText}` : ''}` }
          ],
        }),
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [headlineData, subtitleData] = await Promise.all([headlinePromise, subtitlePromise]);
      
      // ═══ ANTI-BANALITY: Parse 3 candidates, filter clichés, pick best ═══
      const rawResponse = headlineData?.choices?.[0]?.message?.content?.trim() || '';
      const candidates = rawResponse
        .split('\n')
        .map((line: string) => line.replace(/^\d+[\.\)\-]\s*/, '').replace(/["""''`.!?]/g, '').replace(/\s{2,}/g, ' ').trim())
        .filter((line: string) => line.length > 2 && line.length <= 40);
      
      console.log('[Headline AI] 3 Candidates:', candidates);
      
      // Filter: remove clichés + unsafe headlines
      const validCandidates = candidates.filter((c: string) => {
        if (isCliche(c)) { console.log(`[Anti-Banality] REJECTED cliché: "${c}"`); return false; }
        if (!isHeadlineSafeForAudience(c, headlineValidationContext)) { console.log(`[Anti-Banality] REJECTED unsafe: "${c}"`); return false; }
        return true;
      });
      
      console.log('[Headline AI] Valid after filter:', validCandidates);
      
      // Pick: prefer shortest (punchiest) among valid candidates
      if (validCandidates.length > 0) {
        // Sort by word count ascending — punchier = better
        validCandidates.sort((a: string, b: string) => a.split(/\s+/).length - b.split(/\s+/).length);
        headline = validCandidates[0];
        console.log('[Headline AI] WINNER:', headline);
      } else if (candidates.length > 0) {
        // All were clichés — take the last one (most creative attempt) but log warning
        headline = candidates[candidates.length - 1];
        console.warn('[Anti-Banality] All candidates were clichés, using least-bad:', headline);
      }
      
      const aiSubtitle = subtitleData?.choices?.[0]?.message?.content?.trim();
      if (aiSubtitle && aiSubtitle.length > 3 && aiSubtitle.length <= 56) {
        subtitle = aiSubtitle.replace(/["""''`]/g, '').slice(0, 56);
        console.log('[Subtitle AI] Generated:', subtitle);
      }
    }
    
    // Fallbacks
    if (!headline) headline = buildCreativeHeadline(rawHeadline, campaignContext, effectiveTopicCategory);
    if (!subtitle && brandContext?.winningFeature) subtitle = brandContext.winningFeature.slice(0, 56);
    else if (!subtitle && brandContext?.primaryXFactor) subtitle = brandContext.primaryXFactor.slice(0, 56);

    // Build contact details string for the ad — NEVER invent placeholder data
    const phone = brandContext?.contactPhone || '';
    const email = brandContext?.contactEmail || '';
    const address = brandContext?.contactAddress || '';
    const whatsapp = brandContext?.contactWhatsapp || '';
    const website = brandContext?.websiteUrl || '';
    const openingHours = brandContext?.openingHours || '';
    const branches = brandContext?.branches || '';
    
    // Sanitize visual prompt — strip placeholder phone numbers the AI may have hallucinated
    const sanitizedVisualPrompt = (visualPrompt || '').replace(/0[2-9]X?[-\s]?X{3,7}/gi, '').replace(/05\d[-\s]?\d{7}/g, phone || '').trim();
    
    // CTA text
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

    console.log('[All-in-One] headline:', headline, '| subtitle:', subtitle, '| phone:', phone, '| ctaText:', ctaText);

    // ═══ STEP 2: Build the All-in-One prompt ═══
    // Build the Hebrew text block for the ad
    let textBlock = '';
    if (headline || subtitle || phone || businessName) {
      const textParts: string[] = [];
      if (headline) textParts.push(`כותרת ראשית (גדולה, בולטת, עברית): "${headline}"`);
      if (subtitle) textParts.push(`כותרת משנה (קטנה יותר, מתחת לכותרת): "${subtitle}"`);
      if (ctaText) textParts.push(`קריאה לפעולה (כפתור/באנר): "${ctaText}"`);
      if (phone) textParts.push(`טלפון (בולט בסטריפ תחתון): ${phone}`);
      if (whatsapp && whatsapp !== phone) textParts.push(`וואטסאפ: ${whatsapp}`);
      if (address) textParts.push(`כתובת: ${address}`);
      if (branches) textParts.push(`סניפים: ${branches}`);
      if (website) textParts.push(`אתר: ${website}`);
      if (openingHours) textParts.push(`שעות פעילות: ${openingHours}`);
      
      textBlock = `
═══ HEBREW TEXT TO INCLUDE IN THE AD (CRITICAL — RENDER ALL TEXT) ═══
${textParts.join('\n')}

IMPORTANT: The business name "${businessName}" already appears in the LOGO. Avoid writing it as separate text in the ad unless it's essential for the message. Never repeat the business name more than once in the entire ad.

TYPOGRAPHY RULES:
- ALL text must be in HEBREW, reading RIGHT-TO-LEFT
- Every letter must be in correct Hebrew reading order — NOT mirrored or reversed
- Headline: LARGE, BOLD, dominant — the first thing the eye sees
- Subtitle: smaller, lighter weight, directly below headline
- Contact details: clean, organized in the BOTTOM CONTACT STRIP
- Phone number: LARGE and clear with area code
- Use PROFESSIONAL Hebrew typography — clean, modern, well-kerned
- Text must be SHARP and PERFECTLY READABLE — no blurry or distorted letters
- CONTACT STRIP TEXT QUALITY: Every single character in the contact strip must be a REAL, READABLE Hebrew letter, digit, or standard punctuation (| : -). NO gibberish, garbled characters, random dots (•••), or placeholder symbols. If you cannot render a word clearly — OMIT IT. Garbled text is worse than no text.
═══════════════════════════════════════════════════════════════════
`;
    }

    // Logo instructions
    let logoBlock = '';
    const logoUrl = brandContext?.logoUrl;
    if (logoUrl) {
      logoBlock = `
═══ BRAND LOGO (ATTACHED AS IMAGE — USE IT EXACTLY) ═══
The client's ACTUAL logo is attached as an image reference.
- Place the logo PROMINENTLY in the BOTTOM-LEFT area of the contact strip (for RTL Hebrew layout)
- The logo should be 15-25% of ad width — NEVER a tiny icon
- Keep the logo in its ORIGINAL colors — do NOT recolor it
- Do NOT invent or modify the logo — use it EXACTLY as provided
═══════════════════════════════════════════════════════════
`;
    } else if (revisionSourceImageUrl) {
      logoBlock = `
REVISION LOGO RULE: The source ad already contains the correct brand logo.
- Keep that exact logo in the same visual zone
- Do NOT replace, redraw, or remove it
- Do NOT invent any new logo symbol
`;
    } else {
      logoBlock = `
LOGO: No logo was provided. Leave the bottom-left corner of the contact strip clean and empty for later logo placement. Do NOT invent any logo or symbol.
`;
    }

    const revisionInstructions = revisionSourceImageUrl ? `
═══ TARGETED REVISION BRIEF ═══
This request is a FIX for an existing ad (source image attached).
- Keep same concept, same composition, same style, same brand identity.
- Apply only the listed client revisions.
- Return ONE corrected version of this exact ad — not a new concept.
- Text must remain fully readable with no clipped/cut words.
═══════════════════════════════
` : '';

    const fullAdPrompt = `Generate a COMPLETE, READY-TO-PUBLISH professional advertisement with BOTH stunning visuals AND Hebrew text, all composed together as ONE cohesive design.

THIS IS A COMPLETE AD — NOT JUST A PHOTO:
- The output must look like a FINISHED print/digital advertisement
- Visual + text + contact details + logo — all integrated into ONE harmonious composition
- Think of how a professional graphic designer would create a complete ad in Photoshop/InDesign

${revisionInstructions}

${textBlock}
${logoBlock}

═══ AD LAYOUT STRUCTURE (MANDATORY — but NEVER render these labels as text in the image!) ═══
TOP AREA — HEADLINE / HOOK (top 15-20% of ad):
  - Main promotional headline in BOLD Hebrew typography
  - Subtitle below in smaller text
  - May include a decorative accent or price callout

CENTER AREA — HERO VISUAL (center 55-65% of ad):
  - The emotional/visual core of the ad
  - High quality, cinematic product/lifestyle photography
  - This is where the visual storytelling happens

BOTTOM AREA — CONTACT STRIP (bottom 15-25% of ad):
  - DARK or BRAND-COLORED background bar for contrast and readability
  - Logo anchored on LEFT side (RTL Hebrew layout)
  - RIGHT side: branch locations, phone numbers, website
  - Phone number: LARGE and clear
  - Multiple branches separated by pipes (|) if applicable

⚠️ CRITICAL WARNING: The area labels above (TOP AREA, CENTER AREA, BOTTOM AREA) are INTERNAL LAYOUT INSTRUCTIONS.
They must NEVER appear as visible text in the generated image! Do NOT write "ZONE", "ZONE 1", "ZONE 2", "ZONE 3", or any English layout labels anywhere in the ad.
Only HEBREW text from the brief should appear in the final ad.
═══════════════════════════════════════════════

VISUAL IMPACT — MAKE IT EXTRAORDINARY:
- PREMIUM COMMERCIAL PHOTOGRAPHY quality, not clipart/illustration
- CINEMATIC composition: dramatic angles, shallow depth of field, professional lighting
- LIGHTING: Professional "Golden Hour" or soft studio lighting
- The visual must be DENSE and RICH — like editorial photography
- AVOID: flat compositions, generic stock-photo look, boring angles

${aspectInstruction}
${mediaFormatInstructions}

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

IMPORTANT: Match the same visual structure, composition style, and layout patterns.
` : ''}

${brandContext ? `
═══ BRAND IDENTITY ═══
Business: "${brandContext.businessName || ''}"
Target Audience: ${brandContext.targetAudience || 'Haredi audience'}
End Consumer: ${brandContext.endConsumer || 'Not specified'}
Primary Differentiator: ${brandContext.primaryXFactor || 'Not specified'}
Winning Feature: ${brandContext.winningFeature || 'Not specified'}
${brandContext.xFactors?.length ? `Additional Differentiators: ${brandContext.xFactors.join(', ')}` : ''}
${brandContext.services?.length ? `Services/Products: ${brandContext.services.join(', ')}` : ''}
${brandContext.competitors?.length ? `Competitors: ${brandContext.competitors.join(', ')}` : ''}
Audience Tone: ${brandContext.audienceTone || 'Not specified'}
═══════════════════════════════════════════════════════════
` : ''}

${campaignContext ? `CAMPAIGN: "${campaignContext.offer || ''}" - Goal: ${campaignContext.goal || 'marketing'}${campaignContext.vibe ? `, Vibe: ${campaignContext.vibe}` : ''}` : ''}
${campaignContext?.adGoal ? `
AD GOAL: "${campaignContext.adGoal}"
${campaignContext.adGoal === 'sell' ? '→ SALES ad: product visibility, pricing emphasis, urgency.' : ''}
${campaignContext.adGoal === 'brand-presence' ? '→ BRANDING ad: premium, elegant, aspirational.' : ''}
${campaignContext.adGoal === 'invite-contact' ? '→ CONTACT ad: warm, welcoming, contact details prominent.' : ''}
${campaignContext.adGoal === 'introduce-product' ? '→ PRODUCT LAUNCH: dramatic reveal, theatrical lighting.' : ''}` : ''}
${campaignContext?.emotionalTone ? `EMOTIONAL TONE: "${campaignContext.emotionalTone}"` : ''}
${campaignContext?.priceOrBenefit ? `PRICE/BENEFIT: "${campaignContext.priceOrBenefit}"` : ''}
${campaignContext?.isTimeLimited && campaignContext?.timeLimitText ? `TIME LIMIT: "${campaignContext.timeLimitText}"` : ''}

DESIGN APPROACH:
${designApproach === 'brand-follower' ? `BRAND FOLLOWER: Replicate EXACT same grid and visual language as client's existing ads.` : 
  designApproach === 'visual-refresh' ? `VISUAL REFRESH: Same grid structure, fresh visual style.` : 
  designApproach === 'structural-flex' ? `STRUCTURAL FLEX: Keep brand DNA, new grid/layout.` : 
  `CREATIVE FREEDOM: Full freedom, design from scratch.`}

${!revisionSourceImageUrl ? `VARIATION INSTRUCTION (MANDATORY DIFFERENTIATION):
- ${variationDirective}
- This sketch must feel clearly different from other variations in concept framing, composition, and visual rhythm while keeping the same brand DNA.` : ''}

${visualApproach === 'product-focus' ? `PRODUCT-FOCUSED: Show ONLY the product/service. ZERO people.` : 
  visualApproach === 'lifestyle' ? `LIFESTYLE: May include ONE Orthodox Jewish man/boy if relevant.` : 
  `GRAPHIC-LED: Premium editorial composition, no clipart.`}

COMMUNITY RULES (NON-NEGOTIABLE):
- This targets the Haredi (Ultra-Orthodox) Jewish community
- ABSOLUTELY NO women or girls in images
- If people ARE needed: men/boys in modest Orthodox attire only (dark suits, white shirts, kippot)
- Clean, premium, professional

GENDER-VISUAL MATCHING:
- If product is FOR WOMEN → NO male figures, use product photography/graphic design only
- If product is FOR MEN → male figures appropriate
- WHEN IN DOUBT → pure product/graphic with NO people

${sectorInsights}
${modelRules}

${normalizedCorrections.length ? `
CLIENT REVISIONS:
${normalizedCorrections.map((c) => `- [${c.type === 'copy' || c.type === 'headline' || c.type === 'subtitle' ? 'TEXT' : c.type === 'visual' ? 'VISUAL' : 'GENERAL'}]: ${c.text}`).join('\n')}
` : ''}

NEGATIVE PROMPT — NEVER include in image:
Split-screens, multiple panels, stock-photo look, low-quality CGI, immodest clothing, distorted limbs.
No religious objects unless holiday-tagged.
No English text labels like "ZONE", "ZONE 1", "ZONE 2", "ZONE 3", "TOP", "CENTER", "BOTTOM", "CONTACT", "HEADLINE".
Only HEBREW text from the brief should be visible.

FINAL CHECKLIST:
✓ Hebrew text is correct, right-to-left, perfectly readable — NO typos or garbled letters
✓ 3-area grid: headline top, visual center, contact strip bottom
✓ Contact details are accurate and complete
✓ Logo is properly placed (if provided)
✓ Visual is cinematic and premium
✓ No clipped/cut Hebrew text at edges or overlays
✓ All community rules respected
✓ NO English layout labels (ZONE, etc.) visible anywhere in the image
✓ The OFFER/NEWS from the brief is clearly communicated in the headline — not replaced by generic text`;

    const engineVersion = engine === 'nano-banana-pro' ? 'nano-banana-pro' : 'nano-banana';
    console.log(`[Pipeline] Starting All-in-One generation (engine: ${engineVersion})`);
    const visualResult = await generateVisualLayer(fullAdPrompt, brandContext, LOVABLE_API_KEY, engineVersion, campaignContext, revisionSourceImageUrl || undefined);
    console.log("[Pipeline] All-in-One generation complete — full ad with text and layout.");

    // Log the generation
    try {
      await supabase
        .from('ai_generation_logs')
        .insert({
          media_type: configMediaType,
          model_config_id: modelConfig?.id || null,
          prompt_used: fullAdPrompt.substring(0, 5000),
          generated_output: visualResult.imageUrl.substring(0, 500),
          generation_type: 'image_all_in_one',
          success: true,
          brand_context: brandContext || null,
          campaign_context: campaignContext || null,
        });
    } catch (logError) {
      console.error('Error logging generation:', logError);
    }

    return new Response(JSON.stringify({ 
      imageUrl: visualResult.imageUrl,
      visualOnlyUrl: visualResult.imageUrl,
      textMeta: {
        headline,
        subtitle,
        businessName,
        phone,
        email,
        address,
        ctaText,
      },
      status: 'approved',
      message: `All-in-One: ${visualResult.model}`,
      model: visualResult.model,
      configUsed: modelConfig?.media_type || 'default',
      allInOne: true,
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
