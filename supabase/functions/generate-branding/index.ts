import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { businessName, essence, differentiator, persona, audience, vision, designPreferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Generate brand strategy (colors, fonts, tagline, brand voice)
    console.log("Step 1: Generating brand strategy...");
    const strategyPrompt = `You are a world-class branding expert specializing in the Israeli Haredi market. 
Create a complete brand identity based on this brief:

Business Name: ${businessName || "Not specified"}
Core Expertise: ${essence}
Differentiator: ${differentiator}
Brand Persona: ${persona}
Target Audience: ${audience}
Vision: ${vision}
Design Preferences: ${designPreferences}

Return a JSON object with this EXACT structure (no markdown, no backticks, just pure JSON):
{
  "tagline_options": [
    {"hebrew": "סלוגן עברי 2-3 מילים בלבד - יצירתי שמעביר את הערך", "english": "English translation 1", "style": "יצירתי"},
    {"hebrew": "סלוגן עברי 2-3 מילים בלבד - אינפורמטיבי שמתאר את התחום", "english": "English translation 2", "style": "אינפורמטיבי"},
    {"hebrew": "סלוגן עברי 2-3 מילים בלבד - יצירתי נוסף", "english": "English translation 3", "style": "יצירתי"}
  ],
  "tagline": "The best tagline from the options above (Hebrew) - MUST be 2-3 words only",
  "tagline_english": "English translation of the best tagline",
  "brand_voice": "2-3 sentences describing the brand's communication style in Hebrew",
  
  CRITICAL TAGLINE RULES:
  - Each tagline MUST be exactly 2-3 Hebrew words. Maximum 4 words in rare cases. NEVER more.
  - Examples of GOOD taglines: "משרד פרסום בוטיקי", "חוויה מעל הכל", "עיצוב ללא פשרות", "הבית של הקריאייטיב"
  - Examples of BAD taglines (too long): "מגשימים חזון בונים עתיד יצירתי" - this is 5 words, NOT allowed
  - Style "יצירתי": A creative phrase that conveys the brand's core value metaphorically
  - Style "אינפורמטיבי": A descriptive phrase that tells what the business does (like "משרד פרסום בוטיקי")
  "colors": {
    "primary": "#HEX - the main brand color",
    "secondary": "#HEX - complementary accent color",
    "accent": "#HEX - highlight/CTA color",
    "background": "#HEX - light background tone",
    "dark": "#HEX - dark variant for contrast"
  },
  "fonts": {
    "header": "Best Hebrew Google Font for headers (from: Assistant, Heebo, Rubik, Alef, David Libre, Frank Ruhl Libre, Secular One, Suez One)",
    "body": "Best Hebrew Google Font for body text",
    "header_reasoning": "Why this font fits the brand",
    "body_reasoning": "Why this font fits the brand"
  },
  "logo_concept": "Detailed description of the ideal logo concept - shapes, symbols, style (minimalist/bold/elegant), what it should communicate",
  "brand_essence_summary": "A compelling 2-sentence Hebrew summary of the entire brand identity",
  "mockup_scenes": [
    "Description of mockup scene 1 (e.g., business card on marble surface)",
    "Description of mockup scene 2 (e.g., storefront signage)",
    "Description of mockup scene 3 (e.g., letterhead and envelope)"
  ]
}`;

    const strategyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: strategyPrompt }],
      }),
    });

    if (!strategyResponse.ok) {
      const status = strategyResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Strategy generation failed: ${status}`);
    }

    const strategyData = await strategyResponse.json();
    let strategyText = strategyData.choices?.[0]?.message?.content || "";
    
    // Clean JSON from markdown
    strategyText = strategyText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Extract JSON object boundaries
    const jsonStart = strategyText.indexOf('{');
    const jsonEnd = strategyText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      strategyText = strategyText.substring(jsonStart, jsonEnd + 1);
    }
    
    // Fix common JSON issues
    strategyText = strategyText
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : '');
    
    let strategy;
    try {
      strategy = JSON.parse(strategyText);
    } catch (e) {
      console.error("Failed to parse strategy JSON:", strategyText.slice(0, 500));
      // Last resort: try to balance braces
      try {
        const open = (strategyText.match(/{/g) || []).length;
        const close = (strategyText.match(/}/g) || []).length;
        if (open > close) {
          strategyText += '}'.repeat(open - close);
        }
        strategy = JSON.parse(strategyText);
      } catch (e2) {
        throw new Error("Failed to parse brand strategy");
      }
    }

    console.log("Strategy generated:", strategy.tagline);

    // Step 2: Generate multiple logo style options
    console.log("Step 2: Generating logo variations...");
    
    const logoStyles = [
      {
        name: 'מינימליסטי יוקרתי',
        nameEn: 'Luxury Minimal',
        description: 'Elegant minimalist logo with premium feel',
        colorWorld: 'Black, gold (#C9A84C), and off-white. Think luxury fashion brands like Chanel or Dior.',
        styleDirective: `Ultra-premium minimalist logo. Thin elegant serif or sans-serif typography. The business name "${businessName || 'Brand'}" in Hebrew with refined letter spacing. Colors: black and gold only. NO gradients, NO complex shapes. Think high-end fashion brand. Extremely clean, lots of white space. Sophisticated and timeless.`,
        includesName: true,
      },
      {
        name: 'מודרני דיגיטלי',
        nameEn: 'Modern Digital',
        description: 'Tech-forward modern logo with bold colors',
        colorWorld: 'Electric blue (#2563EB), cyan (#06B6D4), and dark navy (#0F172A). Think tech startups like Stripe or Vercel.',
        styleDirective: `Modern tech-forward logo. Bold geometric icon ABOVE the business name "${businessName || 'Brand'}" in Hebrew. Use electric blue and cyan gradients. Clean sans-serif font. The icon should be abstract/geometric - circles, hexagons, or intersecting shapes. Feels like a successful tech company. Contemporary and innovative.`,
        includesName: true,
      },
      {
        name: 'אורגני טבעי',
        nameEn: 'Organic Natural',
        description: 'Warm organic logo with natural earth tones',
        colorWorld: 'Deep forest green (#1B4332), warm terracotta (#C2703E), and cream (#FDF6EC). Think artisan/boutique brands.',
        styleDirective: `Warm organic logo with the business name "${businessName || 'Brand'}" in Hebrew alongside a hand-drawn style icon. Use earthy green and terracotta colors. The icon should feel organic - leaves, flowing lines, or handcrafted elements. Rounded, warm typography. Feels like a premium artisan brand. Inviting and authentic.`,
        includesName: true,
      },
      {
        name: 'בולד גרפי',
        nameEn: 'Bold Graphic',
        description: 'High-impact bold graphic logo',
        colorWorld: 'Deep red (#B91C1C), charcoal (#1F2937), and white. Think powerful brands like CNN or Netflix.',
        styleDirective: `High-impact bold logo where the Hebrew letters of "${businessName || 'Brand'}" are designed with creative graphic treatment - letters integrated with a strong visual concept related to the business field. Bold, thick strokes. Red and dark charcoal color scheme. Commanding presence. Think FedEx arrow or Amazon smile - clever hidden meaning in the typography. Strong and memorable.`,
        includesName: true,
      },
      {
        name: 'קלאסי מעוצב',
        nameEn: 'Classic Refined',
        description: 'Timeless classic logo with emblem style',
        colorWorld: 'Navy blue (#1E3A5F), silver/gray (#94A3B8), and white. Think professional firms like law offices or financial institutions.',
        styleDirective: `Classic emblem-style logo. The business name "${businessName || 'Brand'}" in Hebrew inside or alongside a refined crest, shield, or circular emblem. Navy blue and silver color scheme. Traditional serif typography. Feels established, trustworthy, and professional. Think heritage brands, luxury hotels, or premium financial services. Timeless and authoritative.`,
        includesName: true,
      },
    ];

    const logoPromises = logoStyles.map(async (style, idx) => {
      try {
        // Small stagger to avoid rate limits
        await new Promise(r => setTimeout(r, idx * 1500));
        
        const logoPrompt = `Create a professional logo for a business called "${businessName || 'Brand'}".
Business field: ${essence || strategy.logo_concept}
VISUAL WORLD: ${style.colorWorld}
Design style: ${style.styleDirective}

CRITICAL RULES:
- ${style.includesName ? `The business name "${businessName || 'Brand'}" MUST appear clearly in Hebrew as part of the logo` : 'Create ONLY the logo mark/icon - NO text, NO letters'}
- USE ONLY the colors specified in VISUAL WORLD above - do NOT use the same colors as other variations
- Each logo variation must feel like it comes from a completely different design studio
- On a clean white background, centered, with generous padding
- High resolution, crisp edges, professional quality
- The design must feel premium and sophisticated`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: logoPrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!resp.ok) {
          console.error(`Logo style ${idx} (${style.nameEn}) failed:`, resp.status);
          return null;
        }
        const d = await resp.json();
        const imageUrl = d.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
        return imageUrl ? { ...style, image: imageUrl } : null;
      } catch (e) {
        console.error(`Logo style ${idx} error:`, e);
        return null;
      }
    });

    const logoResults = [];
    for (const promise of logoPromises) {
      const result = await promise;
      if (result) logoResults.push(result);
    }
    
    console.log("Logo variations generated:", logoResults.length);
    // Keep the first one as the primary for backward compatibility
    const logoBase64 = logoResults[0]?.image || null;

    // Step 3: Generate mockup images (2 mockups in parallel)
    console.log("Step 3: Generating mockups...");
    const mockupScenes = strategy.mockup_scenes || [
      "Professional business card on a marble surface",
      "Store signage on a modern building facade",
      "Branded letterhead and envelope set"
    ];

    const mockupPromises = mockupScenes.slice(0, 3).map(async (scene: string, idx: number) => {
      try {
        const mockupPrompt = `Create a photorealistic mockup visualization for a brand called "${businessName || 'Brand'}".
Scene: ${scene}
Brand colors: Primary ${strategy.colors.primary}, Secondary ${strategy.colors.secondary}
Style: High-end, professional product photography. Elegant lighting, shallow depth of field.
The mockup should show the brand's visual identity (colors, patterns) applied to the physical item.
NO text or letters in the image - just show the colors and design patterns applied to the object.`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: mockupPrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!resp.ok) {
          console.error(`Mockup ${idx} failed:`, resp.status);
          return null;
        }
        const d = await resp.json();
        return d.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      } catch (e) {
        console.error(`Mockup ${idx} error:`, e);
        return null;
      }
    });

    // Process mockups sequentially (1 at a time to avoid rate limits)
    const mockupImages: (string | null)[] = [];
    for (const promise of mockupPromises) {
      const result = await promise;
      mockupImages.push(result);
      // Small delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("Mockups generated:", mockupImages.filter(Boolean).length);

    // Return complete branding package
    return new Response(JSON.stringify({
      success: true,
      strategy,
      logo: logoBase64,
      logoOptions: logoResults,
      mockups: mockupImages.filter(Boolean),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Branding generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
