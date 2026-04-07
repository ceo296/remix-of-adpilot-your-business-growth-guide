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

    const voiceInstruction = buildVoiceInstruction(voiceDirection);
    const voiceName = selectVoice(voiceDirection);

    const ttsPrompt = `${voiceInstruction}\n\nPlease read the following Hebrew radio advertisement script aloud with proper pronunciation, intonation, and emotion:\n\n${script}`;

    // Try Gemini TTS
    if (GEMINI_KEY) {
      // Try multiple model variants
      const models = [
        "gemini-2.5-flash-preview-tts",
        "gemini-2.5-pro-preview-tts",
      ];

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
          
          const payload = {
            contents: [
              {
                role: "user",
                parts: [{ text: ttsPrompt }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName,
                  },
                },
              },
            },
          };

          console.log(`Trying TTS model: ${model}, voice: ${voiceName}`);

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            const audioPart = data.candidates?.[0]?.content?.parts?.find(
              (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
            );

            if (audioPart?.inlineData) {
              console.log(`TTS success with model: ${model}`);
              return new Response(
                JSON.stringify({
                  audioAvailable: true,
                  audioBase64: audioPart.inlineData.data,
                  mimeType: audioPart.inlineData.mimeType,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } else {
            const errText = await response.text();
            console.warn(`TTS model ${model} failed (${response.status}): ${errText.substring(0, 300)}`);
          }
        } catch (e) {
          console.warn(`TTS model error:`, e);
        }
      }
    }

    // Fallback: no audio available
    console.warn("No TTS audio generated from any model");
    return new Response(
      JSON.stringify({
        audioAvailable: false,
        message: "קריינות אינה זמינה כרגע. התסריט מוכן כטקסט.",
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
  const gender = voiceDirection?.gender || "גברי";
  if (gender === "נשי" || gender === "women") {
    return "Zephyr";
  }
  return "Charon";
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
