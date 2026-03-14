import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { script, voiceDirection } = await req.json();

    if (!script) throw new Error("Missing script text");

    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    // Use Gemini TTS via the multimodal API
    // Build voice style instruction for the model
    const voiceInstruction = buildVoiceInstruction(voiceDirection);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${voiceInstruction}\n\nPlease read the following Hebrew radio advertisement script aloud with proper pronunciation, intonation, and emotion:\n\n${script}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectVoice(voiceDirection),
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini TTS error:", response.status, errText);
      throw new Error(`Gemini TTS API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract audio data from response
    const audioPart = data.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
    );

    if (!audioPart?.inlineData) {
      // Fallback: if Gemini doesn't return audio, return text-only
      console.warn("No audio returned from Gemini TTS, returning text-only");
      return new Response(
        JSON.stringify({ 
          audioAvailable: false, 
          message: "קריינות אינה זמינה כרגע. התסריט מוכן כטקסט." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBase64 = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType;

    return new Response(
      JSON.stringify({ 
        audioAvailable: true,
        audioBase64,
        mimeType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-radio-tts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function selectVoice(voiceDirection: any): string {
  // Gemini prebuilt voices - select based on gender
  const gender = voiceDirection?.gender || "גברי";
  if (gender === "נשי" || gender === "women") {
    return "Zephyr"; // Female voice
  }
  return "Charon"; // Male voice
}

function buildVoiceInstruction(voiceDirection: any): string {
  if (!voiceDirection) return "Read in a warm, professional tone in Hebrew.";
  
  const parts = [
    `Voice style: ${voiceDirection.style || "warm and professional"}`,
    `Tone: ${voiceDirection.tone || "professional"}`,
    `Pace: ${voiceDirection.pace || "medium"}`,
  ];
  
  if (voiceDirection.notes) {
    parts.push(`Additional notes: ${voiceDirection.notes}`);
  }
  
  return parts.join(". ") + ". Read clearly in Hebrew with proper nikud pronunciation.";
}
