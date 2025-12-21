import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { visualPrompt, textPrompt, style, engine } = await req.json();
    console.log("Received request:", { visualPrompt, textPrompt, style, engine });

    // Build the prompt based on engine and style
    let fullPrompt = '';
    
    if (engine === 'nano-banana') {
      // Nano Banana Pro - optimized for Hebrew text
      const styleDescriptions: Record<string, string> = {
        'ultra-realistic': 'ultra-realistic photograph, professional photography, high detail',
        '3d-character': '3D rendered Pixar-style characters, vibrant colors, cartoon style',
        'oil-painting': 'classical oil painting style, luxury aesthetic, rich textures',
      };
      
      fullPrompt = `Create a professional advertisement image. ${styleDescriptions[style] || styleDescriptions['ultra-realistic']}. 
      
Scene description: ${visualPrompt}

${textPrompt ? `The image MUST include the following Hebrew text prominently displayed: "${textPrompt}". The Hebrew text should be clear, readable, and beautifully integrated into the design.` : ''}

Important: This is for a Haredi (Ultra-Orthodox Jewish) audience. Ensure modesty in all imagery - no inappropriate content, modest dress codes, and family-friendly atmosphere.`;

    } else {
      // Flux Realism - photorealistic without text
      fullPrompt = `Create a high-end photorealistic image. Professional photography quality, cinematic lighting.

Scene description: ${visualPrompt}

Important: This is for a Haredi (Ultra-Orthodox Jewish) audience. Ensure modesty in all imagery - no inappropriate content, modest dress codes, and family-friendly atmosphere. Do not include any text in the image.`;
    }

    console.log("Generated prompt:", fullPrompt);

    // Use google/gemini-3-pro-image-preview for next-gen image generation (Nano Banana Pro)
    const model = engine === 'nano-banana' 
      ? 'google/gemini-3-pro-image-preview' 
      : 'google/gemini-2.5-flash-image';

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

    // Return the generated image
    return new Response(JSON.stringify({ 
      imageUrl,
      status: 'approved', // Will be enhanced with actual kosher check later
      message: data.choices?.[0]?.message?.content || ''
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
