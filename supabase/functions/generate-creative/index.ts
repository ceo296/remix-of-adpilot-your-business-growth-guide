import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock image URLs for different styles (for testing UI)
const mockImages: Record<string, string[]> = {
  naki: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
  ],
  boet: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
  ],
  classic: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=600&fit=crop',
  ],
  modern: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=800&h=600&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop',
  ],
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style } = await req.json();

    console.log('Received request:', { prompt, style });

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get mock images based on style
    const styleKey = style && mockImages[style] ? style : 'default';
    const images = mockImages[styleKey];
    const imageUrl = images[Math.floor(Math.random() * images.length)];

    console.log('Returning mock image:', { style: styleKey, imageUrl });

    // TODO: Replace with actual AI API call
    // Example for future implementation:
    // const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'google/gemini-2.5-flash-image',
    //     messages: [{ role: 'user', content: prompt }],
    //     modalities: ['image', 'text']
    //   }),
    // });

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        prompt,
        style: styleKey,
        isMock: true, // Flag to indicate this is mock data
        message: 'Mock image generated successfully. Replace with real AI API in production.',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in generate-creative function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
