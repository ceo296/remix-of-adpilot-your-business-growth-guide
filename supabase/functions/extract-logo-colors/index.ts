import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !userData?.user) {
    console.error('Auth error:', userError?.message);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();
    
    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Either imageUrl or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Normalize base64 inputs (support both full data URLs and raw base64 strings)
    let normalizedBase64 = null;
    let isPdf = false;
    
    if (imageBase64) {
      if (imageBase64.startsWith("data:application/pdf")) {
        normalizedBase64 = imageBase64;
        isPdf = true;
      } else if (imageBase64.startsWith("data:")) {
        normalizedBase64 = imageBase64;
      } else {
        normalizedBase64 = `data:image/png;base64,${imageBase64}`;
      }
    }

    // Use base64 if provided, otherwise use URL
    const imageContent = normalizedBase64 || imageUrl;
    const isBase64 = !!normalizedBase64;

    console.log("extract-logo-colors input:", {
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      isPdf,
      base64Prefix: typeof imageBase64 === "string" ? imageBase64.slice(0, 32) : null,
    });

    const systemPrompt = `You are a professional brand analyst. Analyze the provided logo image and extract:
1. The dominant BRAND colors
2. The closest matching Hebrew Google Font for the logo's typography

Return ONLY a valid JSON object with this exact structure:
{
  "primary": "#XXXXXX",
  "secondary": "#XXXXXX", 
  "background": "#XXXXXX",
  "headerFont": "FontName",
  "bodyFont": "FontName"
}

COLOR RULES (follow strictly):
- Use ONLY 6-digit hex color codes (e.g., #FF5733)
- No explanation, no markdown, JSON only
- Analyze ALL visible colors in the logo carefully

For COLORFUL/MULTI-COLOR logos:
- If the logo has multiple bright colors, pick the MOST prominent/largest color as primary
- Pick the second most prominent color as secondary

For TEXT-HEAVY logos:
- If the main wordmark text is a specific color, that should be primary
- Small accents (dots, underlines) should be secondary

For MONOCHROME logos:
- If the logo is truly black/white only, use those colors
- Set secondary to the same as primary if only one color exists

- Background is the canvas behind the logo; if white/light use #FFFFFF

FONT RULES:
- headerFont = the font closest to the MAIN TEXT / wordmark in the logo
- bodyFont = a complementary readable Hebrew font for body text
- You MUST choose from this exact list of Hebrew Google Fonts:
  "Assistant", "Heebo", "Rubik", "Alef", "David Libre", "Frank Ruhl Libre", "Secular One", "Suez One"
- Match based on weight, serif vs sans-serif, roundness, and overall feel:
  - Thick/bold sans-serif → "Rubik" or "Secular One"
  - Elegant serif / traditional → "Frank Ruhl Libre" or "David Libre" or "Suez One"
  - Clean modern sans-serif → "Assistant" or "Heebo"
  - Rounded friendly → "Alef" or "Rubik"
- If the logo has a serif/traditional typeface, pair it: headerFont=serif, bodyFont=sans-serif
- If the logo has a modern sans-serif, pair: headerFont=that sans, bodyFont=complementary sans

IMPORTANT: Actually look at the typography style in the image. Do NOT default to "Assistant"/"Heebo" unless the logo actually uses a clean modern sans-serif.`;

    console.log("Sending image to AI for color extraction...");
    console.log("Image content type:", isBase64 ? "base64" : "URL");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this logo and extract the color palette. Return only the JSON with primary, secondary, and background colors.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageContent,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response content:", content);

    // Parse the JSON response
    let colors;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        colors = JSON.parse(jsonMatch[0]);
        console.log("Extracted colors from AI:", colors);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw content:", content);
      // Return an error instead of default colors - let the caller know extraction failed
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse color response",
          rawContent: content,
          colors: null 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate colors are proper hex codes
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const validationErrors: string[] = [];
    
    if (!hexRegex.test(colors.primary)) {
      validationErrors.push(`Invalid primary: ${colors.primary}`);
    }
    if (!hexRegex.test(colors.secondary)) {
      validationErrors.push(`Invalid secondary: ${colors.secondary}`);
    }
    if (!hexRegex.test(colors.background)) {
      colors.background = "#FFFFFF";
    }
    
    // Validate fonts against allowed list
    const allowedFonts = ["Assistant", "Heebo", "Rubik", "Alef", "David Libre", "Frank Ruhl Libre", "Secular One", "Suez One"];
    const headerFont = allowedFonts.includes(colors.headerFont) ? colors.headerFont : null;
    const bodyFont = allowedFonts.includes(colors.bodyFont) ? colors.bodyFont : null;
    
    if (validationErrors.length > 0) {
      console.error("Color validation errors:", validationErrors);
    }

    console.log("Returning colors and fonts:", { colors, headerFont, bodyFont });

    return new Response(
      JSON.stringify({ 
        colors: { primary: colors.primary, secondary: colors.secondary, background: colors.background },
        fonts: headerFont ? { headerFont, bodyFont: bodyFont || "Heebo" } : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-logo-colors:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        colors: null // Don't return default colors - let caller know extraction failed
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
