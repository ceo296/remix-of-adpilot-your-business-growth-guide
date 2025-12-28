import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { visualPrompt, textPrompt, style, engine, templateId, templateHints, dimensions } = await req.json();
    console.log("Received request:", { visualPrompt, textPrompt, style, engine, templateId });

    // Get style description
    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS['ultra-realistic'];
    
    // Get template-specific prompts if available
    const templatePrompt = templateId ? TEMPLATE_PROMPTS[templateId] || '' : '';
    const additionalHints = templateHints || '';

    // Build enhanced prompt
    let fullPrompt = '';
    
    if (engine === 'nano-banana' || !engine) {
      // Gemini Pro Image - highest quality with Hebrew text support
      fullPrompt = `Create a stunning professional advertisement image.

STYLE: ${styleDesc}

${templatePrompt ? `FORMAT: ${templatePrompt}` : ''}

SCENE: ${visualPrompt}

${additionalHints ? `ADDITIONAL GUIDANCE: ${additionalHints}` : ''}

${textPrompt ? `HEBREW TEXT TO INCLUDE: "${textPrompt}"
The Hebrew text must be:
- Prominently displayed and perfectly legible
- Beautifully integrated into the design
- Using elegant, professional Hebrew typography
- Properly right-to-left oriented` : 'Do not include any text in the image.'}

${dimensions ? `TARGET DIMENSIONS: ${dimensions.width}x${dimensions.height} pixels` : ''}

CRITICAL REQUIREMENTS:
- This is for a Haredi (Ultra-Orthodox Jewish) audience
- Absolute modesty in all imagery - no inappropriate content
- If showing people: modest dress only (long sleeves, covered legs for women; traditional attire for men)
- Family-friendly, dignified atmosphere
- Professional advertising quality
- Commercial-grade composition and lighting`;

    } else {
      // Flux model for non-text photorealism
      fullPrompt = `Create a photorealistic commercial image.

STYLE: ${styleDesc}

${templatePrompt ? `FORMAT: ${templatePrompt}` : ''}

SCENE: ${visualPrompt}

${additionalHints ? `ADDITIONAL GUIDANCE: ${additionalHints}` : ''}

REQUIREMENTS:
- Ultra high quality photorealism
- Professional lighting and composition
- No text in image
- Haredi audience appropriate - absolute modesty
- Commercial advertising quality`;
    }

    console.log("Enhanced prompt:", fullPrompt);

    // Select best model based on requirements
    const model = (engine === 'nano-banana' || textPrompt) 
      ? 'google/gemini-3-pro-image-preview'  // Best for Hebrew text
      : 'google/gemini-2.5-flash-image';      // Fast for no-text images

    console.log("Using model:", model);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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

      return new Response(JSON.stringify({ 
        error: "שגיאה ביצירת התמונה. נסה שוב." 
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

    return new Response(JSON.stringify({ 
      imageUrl,
      status: 'approved',
      message: data.choices?.[0]?.message?.content || '',
      model: model,
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
