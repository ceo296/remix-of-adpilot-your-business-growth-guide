import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const normalizedBase64 = imageBase64
      ? (imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`)
      : null;

    // Use base64 if provided, otherwise use URL
    const imageContent = normalizedBase64 || imageUrl;
    const isBase64 = !!normalizedBase64;

    console.log("extract-logo-colors input:", {
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      base64Prefix: typeof imageBase64 === "string" ? imageBase64.slice(0, 32) : null,
    });

    const systemPrompt = `You are a professional brand color analyst. Analyze the provided logo image and extract the dominant BRAND colors.

Return ONLY a valid JSON object with this exact structure:
{
  "primary": "#XXXXXX",
  "secondary": "#XXXXXX", 
  "background": "#XXXXXX"
}

Rules (follow strictly):
- Use ONLY 6-digit hex color codes (e.g., #FF5733)
- No explanation, no markdown, JSON only
- Analyze ALL visible colors in the logo carefully

For COLORFUL/MULTI-COLOR logos:
- If the logo has multiple bright colors (pink, blue, green, purple, yellow, etc.), pick the MOST prominent/largest color as primary
- Pick the second most prominent color as secondary
- Do NOT default to black or red unless those are actually the main colors in the logo

For TEXT-HEAVY logos:
- If the main wordmark text is a specific color, that should be primary
- Small accents (dots, underlines) should be secondary

For MONOCHROME logos:
- If the logo is truly black/white only, use those colors
- Set secondary to the same as primary if only one color exists

- Background is the canvas behind the logo; if white/light use #FFFFFF

IMPORTANT: Actually look at the colors in the image. Do NOT guess or use generic defaults like #E31E24 or #000000 unless you actually see those exact colors prominently in the logo.`;

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
      colors.background = "#FFFFFF"; // Background can default to white
    }
    
    if (validationErrors.length > 0) {
      console.error("Color validation errors:", validationErrors);
    }

    console.log("Returning colors:", colors);

    return new Response(
      JSON.stringify({ colors }),
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
