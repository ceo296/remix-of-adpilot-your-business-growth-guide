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
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    const voiceName = selectVoice(voiceDirection);
    const voiceInstruction = buildVoiceInstruction(voiceDirection);
    const ttsPrompt = voiceInstruction + "\n\nPlease read the following Hebrew radio advertisement script aloud with proper pronunciation, intonation, and emotion:\n\n" + script;

    const ttsPayload = {
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

    // Attempt 1: Direct Gemini API
    if (GEMINI_KEY) {
      const result = await tryGeminiDirect(GEMINI_KEY, ttsPayload);
      if (result) {
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Attempt 2: Lovable AI Gateway
    if (LOVABLE_KEY) {
      const result = await tryLovableGateway(LOVABLE_KEY, ttsPrompt, voiceName);
      if (result) {
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: no audio
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

async function tryGeminiDirect(apiKey: string, payload: any): Promise<any | null> {
  const models = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"];
  
  for (const model of models) {
    try {
      console.log("Trying Gemini TTS model:", model);
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
      
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.warn("Gemini TTS " + model + " returned " + resp.status + ": " + errText.substring(0, 500));
        continue;
      }

      const data = await resp.json();
      const audioPart = data.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
      );

      if (audioPart?.inlineData) {
        console.log("TTS success with " + model);
        return {
          audioAvailable: true,
          audioBase64: audioPart.inlineData.data,
          mimeType: audioPart.inlineData.mimeType,
        };
      }
    } catch (e) {
      console.warn("Gemini TTS " + model + " error:", e);
    }
  }
  return null;
}

async function tryLovableGateway(apiKey: string, prompt: string, voiceName: string): Promise<any | null> {
  try {
    console.log("Trying Lovable AI Gateway for TTS");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["audio"],
        audio: {
          voice: voiceName.toLowerCase(),
          format: "mp3",
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn("Lovable Gateway TTS failed (" + resp.status + "): " + errText.substring(0, 300));
      return null;
    }

    const data = await resp.json();
    const audioData = data.choices?.[0]?.message?.audio?.data;
    if (audioData) {
      console.log("TTS success via Lovable Gateway");
      return {
        audioAvailable: true,
        audioBase64: audioData,
        mimeType: "audio/mp3",
      };
    }
  } catch (e) {
    console.warn("Lovable Gateway TTS error:", e);
  }
  return null;
}

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
    "Voice style: " + (voiceDirection.style || "warm and professional"),
    "Tone: " + (voiceDirection.tone || "professional"),
    "Pace: " + (voiceDirection.pace || "medium"),
  ];

  if (voiceDirection.notes) {
    parts.push("Additional notes: " + voiceDirection.notes);
  }

  return parts.join(". ") + ". Read clearly in Hebrew with proper nikud pronunciation.";
}
