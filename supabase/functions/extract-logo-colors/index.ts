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

Rules:
- Use ONLY 6-digit hex color codes (e.g., #FF5733)
- No explanation, no markdown, JSON only
- Primary: the main brand color users should use for headlines/buttons
  - If it's a text-heavy wordmark, the text color is usually primary
  - If there is a small bright accent (e.g., a dot/mark) and most of the logo text is another color, the text color should be primary
- Secondary: the next most used brand color (often the accent)
- Background: the canvas/background behind the logo; if uncertain use #FFFFFF
- If the logo is monochrome, set secondary to the same as primary`; 

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
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return default colors if parsing fails
      colors = {
        primary: "#E31E24",
        secondary: "#000000",
        background: "#FFFFFF"
      };
    }

    // Validate colors are proper hex codes
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(colors.primary)) colors.primary = "#E31E24";
    if (!hexRegex.test(colors.secondary)) colors.secondary = "#000000";
    if (!hexRegex.test(colors.background)) colors.background = "#FFFFFF";

    return new Response(
      JSON.stringify({ colors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-logo-colors:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        // Return default colors on error
        colors: {
          primary: "#E31E24",
          secondary: "#000000",
          background: "#FFFFFF"
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
