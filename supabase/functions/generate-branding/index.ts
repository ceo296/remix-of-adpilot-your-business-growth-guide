import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { businessName, essence, subField, differentiator, persona, audience, vision, designPreferences, refineLogo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiCallSingle = async (model: string, messages: any[], modalities?: string[]) => {
      const body: any = { model, messages };
      if (modalities) body.modalities = modalities;
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const status = resp.status;
        return { error: `AI call failed: ${status}`, status };
      }
      return resp.json();
    };

    const TEXT_FALLBACKS = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
    const IMAGE_FALLBACKS = ["google/gemini-3.1-flash-image-preview", "google/gemini-3-pro-image-preview"];

    const aiCall = async (model: string, messages: any[], modalities?: string[]) => {
      const fallbacks = modalities ? IMAGE_FALLBACKS : TEXT_FALLBACKS;
      const models = [model, ...fallbacks.filter(m => m !== model)];
      let saw402 = false;
      let saw429 = false;

      for (const m of models) {
        console.log(`Trying model: ${m}`);
        const result = await aiCallSingle(m, messages, modalities);
        if (!result.error) return result;

        console.error(`Model ${m} failed with status ${result.status}`);
        if (result.status === 402) saw402 = true;
        if (result.status === 429) saw429 = true;

        if (result.status >= 400 && result.status < 500 && result.status !== 402 && result.status !== 429) {
          throw new Error(`AI call failed: ${result.status}`);
        }
        await new Promise(r => setTimeout(r, 300));
      }

      if (saw402) throw new Error("PAYMENT_REQUIRED");
      if (saw429) throw new Error("RATE_LIMITED");
      throw new Error("ALL_MODELS_FAILED");
    };

    // ═══════════ REFINE SINGLE LOGO MODE ═══════════
    if (refineLogo) {
      console.log("Refine single logo mode:", refineLogo.feedback);
      const logoLayoutStyles = [
        { style: "typographic", instruction: `PURELY TYPOGRAPHIC logo - absolutely NO icons, NO symbols, NO imagery. The entire logo is ONLY the Hebrew letters of "${businessName || 'Brand'}". Use creative typography: play with letter weight, spacing, ligatures, or a unique custom letterform style.` },
        { style: "icon-integrated", instruction: `A logo where a subtle symbol is CREATIVELY WOVEN INTO the Hebrew letters of "${businessName || 'Brand'}". A letter could transform into a relevant object, negative space within letters could form a shape. The icon should be DISCOVERED within the typography.` },
        { style: "icon-beside", instruction: `A logo with a clean, modern, ABSTRACT ICON placed to the LEFT of the Hebrew name "${businessName || 'Brand'}". The icon should be geometric and abstract - representing ${essence} symbolically.` }
      ];
      const logoLayout = logoLayoutStyles[refineLogo.directionIndex % 3];
      
      const logoPrompt = `Create a professional logo for "${businessName || 'Brand'}".
Business field: ${essence}
${subField ? `Specific products/services & atmosphere: ${subField}` : ''}
COLORS: Primary ${refineLogo.colors.primary}, Secondary ${refineLogo.colors.secondary}, Accent ${refineLogo.colors.accent}

LOGO STYLE: ${logoLayout.style.toUpperCase()}
${logoLayout.instruction}

USER FEEDBACK ON PREVIOUS VERSION: "${refineLogo.feedback}"
Please create a NEW logo that addresses this feedback. The user was not satisfied with the previous version and wants changes based on their notes above.

RULES:
- Business name "${businessName || 'Brand'}" MUST appear clearly in Hebrew
- Use ONLY the specified colors
- Clean white background, centered, generous padding
- Must feel premium and sophisticated
- NEVER use religious items unless the business sells them`;

      const logoData = await aiCall("google/gemini-3.1-flash-image-preview",
        [{ role: "user", content: logoPrompt }], ["image", "text"]);
      const newLogo = logoData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

      // Generate matching mockup with new logo
      let newMockup: string | null = null;
      if (newLogo && refineLogo.mockupScene) {
        try {
          const mockupPrompt = `Create a photorealistic mockup visualization for the brand "${businessName || 'Brand'}".
Business field: ${essence}
Scene: ${refineLogo.mockupScene}
Brand colors: Primary ${refineLogo.colors.primary}, Secondary ${refineLogo.colors.secondary}
CRITICAL: The attached image is the EXACT logo. Place THIS EXACT LOGO onto the mockup product. Do NOT redesign it.
Style: High-end product photography. Elegant lighting, shallow depth of field.`;
          const mockupContent: any[] = [
            { type: "text", text: mockupPrompt },
            { type: "image_url", image_url: { url: newLogo } }
          ];
          const mockupData = await aiCall("google/gemini-3.1-flash-image-preview",
            [{ role: "user", content: mockupContent }], ["image", "text"]);
          newMockup = mockupData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
        } catch (e) { console.error("Refined mockup error:", e); }
      }

      return new Response(JSON.stringify({
        success: true,
        refinedLogo: newLogo,
        refinedMockup: newMockup,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ═══════════ Step 1: Generate 3 branding directions ═══════════
    console.log("Step 1: Generating 3 branding directions...");
    const strategyPrompt = `You are a world-class branding expert specializing in the Israeli Haredi market.
Create 3 COMPLETELY DIFFERENT branding directions for this business.
Each direction must feel like it came from a different design studio with a totally different aesthetic philosophy.

Business Name: ${businessName || "Not specified"}
Core Expertise: ${essence}
${subField ? `Specific Products/Services & Atmosphere: ${subField}` : ''}
Differentiator: ${differentiator}
Brand Persona: ${persona}
Target Audience: ${audience}
Vision: ${vision}
Design Preferences: ${designPreferences}

Return a JSON object (no markdown, no backticks, just pure JSON):
{
  "tagline_options": [
    {"hebrew": "2-3 word Hebrew tagline - creative", "english": "English translation", "style": "יצירתי"},
    {"hebrew": "2-3 word Hebrew tagline - informative", "english": "English translation", "style": "אינפורמטיבי"},
    {"hebrew": "2-3 word Hebrew tagline - creative alt", "english": "English translation", "style": "יצירתי"}
  ],
  "brand_voice": "2-3 sentences describing the brand communication style in Hebrew",
  "brand_essence_summary": "A compelling 2-sentence Hebrew summary of the brand identity",
  "brand_values": [
    {"value": "Hebrew value name (e.g. אמינות)", "icon": "emoji", "designConnection": "One Hebrew sentence: how this value translates to the visual design"}
  ],
  "directions": [
    {
      "name": "Short Hebrew name for this direction (2-3 words like: מינימליזם יוקרתי)",
      "nameEn": "English name",
      "philosophy": "One Hebrew sentence explaining the design rationale - WHY this direction fits the brand",
      "colors": {
        "primary": "#HEX", "secondary": "#HEX", "accent": "#HEX", "background": "#HEX", "dark": "#HEX"
      },
      "colorDescription": "Short Hebrew description of the palette (like: ורוד עתיק עמוק בשילוב רוז גולד)",
      "colorEmotion": "One Hebrew sentence connecting this palette to an emotion (e.g. הכחול העמוק משדר ביטחון ושלווה, הזהב מוסיף תחושת פאר)",
      "fonts": {
        "header": "Hebrew Google Font name",
        "body": "Hebrew Google Font name"
      },
      "logoDirective": "Detailed English instruction for the logo design - style, shapes, composition. IMPORTANT: symbols must represent the BUSINESS FIELD (e.g. megaphone/lightbulb for advertising, fork/plate for food, building for real estate). NEVER use religious items (scrolls, megillahs, Torah, menorahs) unless the business sells them. Haredi feel comes from typography and colors only.",
      "mockupScenes": [
        "English description of mockup scene #1 - MUST be directly related to the business field (e.g., for moving company: branded truck on city street; for catering: elegant table setting with branded napkins)",
        "English description of mockup scene #2 - a different field-relevant application (e.g., for moving company: branded uniform/boxes; for catering: branded packaging/menu card)",
        "English description of mockup scene #3 - a classic branding application (e.g., business card on desk, storefront sign, branded stationery set)"
      ],
      "worldReferences": [
        {"brand": "Famous brand name in this field", "colors": "Their dominant colors (e.g. אדום ולבן)", "lesson": "One Hebrew sentence - what we learn from them"}
      ]
    },
    {
      "name": "...", "nameEn": "...", "philosophy": "...",
      "colors": { "primary": "#HEX", "secondary": "#HEX", "accent": "#HEX", "background": "#HEX", "dark": "#HEX" },
      "colorDescription": "...", "colorEmotion": "...",
      "fonts": { "header": "...", "body": "..." },
      "logoDirective": "...", "mockupScenes": ["...", "...", "..."],
      "worldReferences": [{"brand": "...", "colors": "...", "lesson": "..."}]
    },
    {
      "name": "...", "nameEn": "...", "philosophy": "...",
      "colors": { "primary": "#HEX", "secondary": "#HEX", "accent": "#HEX", "background": "#HEX", "dark": "#HEX" },
      "colorDescription": "...", "colorEmotion": "...",
      "fonts": { "header": "...", "body": "..." },
      "logoDirective": "...", "mockupScenes": ["...", "...", "..."],
      "worldReferences": [{"brand": "...", "colors": "...", "lesson": "..."}]
    }
  ]
}

CRITICAL RULES:
- Each tagline MUST be exactly 2-3 Hebrew words. Maximum 4 in rare cases. NEVER more.
- Each direction MUST have a completely different color palette (different hues, not just shades)
- Each direction MUST have a different aesthetic feel (e.g., one minimalist luxury, one bold modern, one warm organic)
- Font choices: use from Assistant, Heebo, Rubik, Alef, David Libre, Frank Ruhl Libre, Secular One, Suez One
- Color palettes should be dramatically different from each other
- Examples of direction contrast: Black+Gold luxury vs Blue+Cyan tech vs Green+Terracotta organic
- brand_values: provide exactly 3-4 core brand values derived from the brief
- worldReferences: provide exactly 2-3 famous brands from the same industry/field for each direction, showing their color approach
- colorEmotion: connect the chosen colors to the emotional response they create
- mockupScenes: MUST be 3 different scenes. At least 2 must be DIRECTLY related to the business field (e.g., moving company → branded truck, boxes with logo; restaurant → menu card, table setting; real estate → building sign, brochure). The 3rd can be a classic application (business card, storefront, stationery).`;

    const strategyData = await aiCall("google/gemini-2.5-flash", [{ role: "user", content: strategyPrompt }]);

    let strategyText = strategyData.choices?.[0]?.message?.content || "";
    strategyText = strategyText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonStart = strategyText.indexOf('{');
    const jsonEnd = strategyText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      strategyText = strategyText.substring(jsonStart, jsonEnd + 1);
    }
    strategyText = strategyText
      .replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : '');

    let strategy;
    try {
      strategy = JSON.parse(strategyText);
    } catch (e) {
      console.error("Failed to parse strategy JSON:", strategyText.slice(0, 500));
      try {
        const open = (strategyText.match(/{/g) || []).length;
        const close = (strategyText.match(/}/g) || []).length;
        if (open > close) strategyText += '}'.repeat(open - close);
        strategy = JSON.parse(strategyText);
      } catch (e2) {
        throw new Error("Failed to parse brand strategy");
      }
    }

    const directions = strategy.directions || [];
    console.log("Strategy generated with", directions.length, "directions");

    // ═══════════ Step 2: Generate logo + mockup per direction (sequentially to avoid rate limits) ═══════════
    console.log("Step 2: Generating logos and mockups for each direction...");

    const directionResults = [];
    // 3 distinct logo layout styles - one per direction for variety
    const logoLayoutStyles = [
      {
        style: "typographic",
        instruction: `PURELY TYPOGRAPHIC logo - absolutely NO icons, NO symbols, NO imagery.
The entire logo is ONLY the Hebrew letters of "${businessName || 'Brand'}".
Use creative typography: play with letter weight, spacing, ligatures, or a unique custom letterform style.
Think of logos like FedEx, Google, or Coca-Cola - the name IS the logo.
The typography should feel premium, distinctive, and memorable. No clip art, no stock-style icons.`
      },
      {
        style: "icon-integrated",
        instruction: `A logo where a subtle symbol is CREATIVELY WOVEN INTO the Hebrew letters of "${businessName || 'Brand'}".
A letter could transform into a relevant object, negative space within letters could form a shape,
or a stroke could morph into a business-related element related to: ${essence}.
Think of the FedEx arrow, the Amazon smile, or the Spartan Golf Club logo.
The icon should be DISCOVERED within the typography, not placed separately. No separate icon floating above text.`
      },
      {
        style: "icon-beside",
        instruction: `A logo with a clean, modern, ABSTRACT ICON placed to the LEFT of the Hebrew name "${businessName || 'Brand'}".
The icon should be geometric and abstract - representing ${essence} symbolically (like Apple's apple, Nike's swoosh).
NOT a literal illustration or clip art. The icon and text should be on the SAME LINE, side by side.
The icon should be simple enough to work as a standalone favicon.`
      }
    ];

    for (let i = 0; i < Math.min(directions.length, 3); i++) {
      const dir = directions[i];
      const logoLayout = logoLayoutStyles[i];
      console.log(`Direction ${i + 1}: ${dir.nameEn} — generating ${logoLayout.style} logo...`);

      let logoImage = null;
      try {
        const logoPrompt = `Create a professional logo for "${businessName || 'Brand'}".
Business field: ${essence}
${subField ? `Specific products/services & atmosphere: ${subField}` : ''}
COLORS: Primary ${dir.colors.primary}, Secondary ${dir.colors.secondary}, Accent ${dir.colors.accent}

LOGO STYLE: ${logoLayout.style.toUpperCase()}
${logoLayout.instruction}

DESIGN DIRECTIVE: ${dir.logoDirective}

RULES:
- Business name "${businessName || 'Brand'}" MUST appear clearly in Hebrew
- Use ONLY the specified colors
- Clean white background, centered, generous padding
- High resolution, crisp edges, professional quality
- Must feel premium and sophisticated - NOT like stock imagery or clip art
- NEVER use religious items (scrolls, menorahs) unless the business sells them
- Haredi touch comes ONLY through Hebrew typography style and color palette`;

        const logoData = await aiCall("google/gemini-3.1-flash-image-preview",
          [{ role: "user", content: logoPrompt }], ["image", "text"]);
        logoImage = logoData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      } catch (e) {
        console.error(`Logo ${i} error:`, e);
      }

      const mockupScenes = dir.mockupScenes || [dir.mockupScene || 'Professional business card on elegant desk'];
      let mockupImage: string | null = null;
      try {
        console.log(`Direction ${i + 1}: generating mockup...`);
        const mockupPrompt = `Create a photorealistic mockup visualization for the brand "${businessName || 'Brand'}".
Business field: ${essence}
Scene: ${mockupScenes[0]}
Brand colors: Primary ${dir.colors.primary}, Secondary ${dir.colors.secondary}, Background ${dir.colors.background}

CRITICAL: The attached image is the EXACT logo for this brand. You MUST place THIS EXACT LOGO (same typography, same colors, same icon/layout) onto the mockup product. 
Do NOT redesign or reinterpret the logo. Copy it EXACTLY as shown in the attached image onto the product/packaging/item in the scene.

Style: High-end product photography. Elegant lighting, shallow depth of field.
The mockup must feel luxurious and real, with the EXACT logo clearly visible on the product.`;

        // Build message content - include logo image if available
        const mockupMessageContent: any[] = [{ type: "text", text: mockupPrompt }];
        if (logoImage) {
          mockupMessageContent.push({
            type: "image_url",
            image_url: { url: logoImage }
          });
        }

        const mockupData = await aiCall("google/gemini-3.1-flash-image-preview",
          [{ role: "user", content: mockupMessageContent }], ["image", "text"]);
        mockupImage = mockupData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      } catch (e) {
        console.error(`Mockup ${i} error:`, e);
      }

      directionResults.push({
        name: dir.name,
        nameEn: dir.nameEn,
        philosophy: dir.philosophy,
        colors: dir.colors,
        colorDescription: dir.colorDescription,
        colorEmotion: dir.colorEmotion || null,
        fonts: dir.fonts,
        logo: logoImage,
        logoStyle: logoLayout.style,
        mockup: mockupImage,
        mockups: mockupImage ? [mockupImage] : [],
        worldReferences: dir.worldReferences || [],
      });

      if (i < 2) await new Promise(r => setTimeout(r, 500));
    }

    console.log("All directions generated:", directionResults.length);

    return new Response(JSON.stringify({
      success: true,
      strategy: {
        tagline_options: strategy.tagline_options,
        brand_voice: strategy.brand_voice,
        brand_essence_summary: strategy.brand_essence_summary,
        brand_values: strategy.brand_values || [],
      },
      directions: directionResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Branding generation error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "PAYMENT_REQUIRED" ? 402 : message === "RATE_LIMITED" ? 429 : 500;
    const publicMessage =
      message === "PAYMENT_REQUIRED"
        ? "Payment required"
        : message === "RATE_LIMITED"
          ? "Rate limit exceeded"
          : message;

    return new Response(JSON.stringify({ error: publicMessage }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
