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

    const aiCall = async (model: string, messages: any[], modalities?: string[]) => {
      const body: any = { model, messages };
      if (modalities) body.modalities = modalities;
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const status = resp.status;
        if (status === 429 || status === 402) {
          return { error: status === 429 ? "Rate limit exceeded" : "Payment required", status };
        }
        throw new Error(`AI call failed: ${status}`);
      }
      return resp.json();
    };

    // ═══════════ Step 1: Generate 3 branding directions ═══════════
    console.log("Step 1: Generating 3 branding directions...");
    const strategyPrompt = `You are a world-class branding expert specializing in the Israeli Haredi market.
Create 3 COMPLETELY DIFFERENT branding directions for this business.
Each direction must feel like it came from a different design studio with a totally different aesthetic philosophy.

Business Name: ${businessName || "Not specified"}
Core Expertise: ${essence}
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
      "logoDirective": "...", "mockupScene": "...",
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
- colorEmotion: connect the chosen colors to the emotional response they create`;

    const strategyData = await aiCall("google/gemini-2.5-flash", [{ role: "user", content: strategyPrompt }]);
    if (strategyData.error) {
      return new Response(JSON.stringify({ error: strategyData.error }), {
        status: strategyData.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    for (let i = 0; i < Math.min(directions.length, 3); i++) {
      const dir = directions[i];
      console.log(`Direction ${i + 1}: ${dir.nameEn} — generating logo...`);

      // Generate logo
      let logoImage = null;
      try {
        const logoPrompt = `Create a professional logo for a business called "${businessName || 'Brand'}".
Business field: ${essence}
COLOR PALETTE TO USE: Primary ${dir.colors.primary}, Secondary ${dir.colors.secondary}, Accent ${dir.colors.accent}
DESIGN DIRECTIVE: ${dir.logoDirective}

CRITICAL RULES:
- The business name "${businessName || 'Brand'}" MUST appear clearly in Hebrew as part of the logo
- Use ONLY the colors specified above
- On a clean white background, centered, with generous padding
- High resolution, crisp edges, professional quality
- This must feel premium and sophisticated
- IRON RULE: Logo icons/symbols MUST represent the actual business field ("${essence}"). For an advertising agency use creative symbols (pen, lightbulb, megaphone, speech bubble). For a restaurant use food elements. For real estate use buildings/keys. NEVER use generic religious items (scrolls, megillahs, holy books, quills, menorahs, Torah scrolls) UNLESS the business itself sells religious items or books.
- The "Haredi touch" should come ONLY through Hebrew typography style (serif fonts, classic letter forms) and color palette choices — NOT through religious objects or sacred items.
- Think like a top branding agency: the logo must communicate what the business DOES, not who the audience is.`;

        const logoData = await aiCall("google/gemini-3.1-flash-image-preview",
          [{ role: "user", content: logoPrompt }], ["image", "text"]);
        logoImage = logoData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      } catch (e) {
        console.error(`Logo ${i} error:`, e);
      }

      // Small delay before mockup
      await new Promise(r => setTimeout(r, 1500));

      // Generate mockup
      let mockupImage = null;
      try {
        console.log(`Direction ${i + 1}: generating mockup...`);
        const mockupPrompt = `Create a photorealistic mockup visualization for a brand called "${businessName || 'Brand'}".
Scene: ${dir.mockupScene}
Brand colors: Primary ${dir.colors.primary}, Secondary ${dir.colors.secondary}, Background ${dir.colors.background}
Style: High-end product photography. Elegant lighting, shallow depth of field.
Show the brand's visual identity (colors, patterns) applied to the physical item.
NO text or letters in the image - just show the colors and design applied to the object.
The mockup must feel luxurious and real.`;

        const mockupData = await aiCall("google/gemini-3.1-flash-image-preview",
          [{ role: "user", content: mockupPrompt }], ["image", "text"]);
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
        mockup: mockupImage,
        worldReferences: dir.worldReferences || [],
      });

      // Delay between directions
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
