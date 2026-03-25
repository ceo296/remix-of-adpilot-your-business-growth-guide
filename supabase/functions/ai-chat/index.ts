import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json();
    const { messages, message, context, skipHistory, audioBase64, audioFormat } = body;
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI API key configured');
    }

    // ═══ AUDIO TRANSCRIPTION MODE ═══
    const hasAudio = !!audioBase64;

    // Support both: { messages: [...] } (chat widget) and { message: "..." } (single-shot)
    const isSingleShot = !messages && message;

    // System prompt focused ONLY on system navigation
    const systemPrompt = `אתה עוזר ניווט במערכת ADKOP - מערכת פרסום חכמה לקהילה החרדית.

תפקידך היחיד הוא לעזור למשתמשים להשתמש במערכת. אתה לא עונה על שאלות כלליות, לא כותב טקסטים פרסומיים, ולא נותן עצות שיווק.

אלו הפעולות שהמערכת תומכת בהן ואיך להגיע אליהן:

📋 **מיתוג (אונבורדינג)**
- נכנסים דרך תהליך ה-Onboarding הראשוני שמופיע אחרי ההרשמה
- שם מזינים: שם עסק, לוגו, צבעים, פונטים, קהל יעד, מתחרים ועוד
- אפשר לעדכן פרטים בכל רגע דרך עמוד "פרופיל" בתפריט הצדדי

🎯 **יצירת קמפיין חדש**
- לוחצים על "קמפיין חדש" בתפריט הצדדי
- ממלאים בריף: מה ההצעה, מטרת הפרסומת, טון רגשי, פרטי קשר להצגה
- אחרי הבריף עוברים לסטודיו היצירתי ליצירת מודעות

🎨 **סטודיו יצירתי**
- נגיש דרך "סטודיו יצירתי" בתפריט או דרך תהליך הקמפיין
- שלושה מסלולים: אוטופיילוט (AI יוצר הכל), ידני (בניית בריף מודרך), או העלאת חומר מוכן
- אפשר לבחור סוג מדיה (מודעה, באנר, שילוט, סושיאל)

📰 **רכישת מדיה**
- מתוך לוח הבקרה לוחצים "רכישת מדיה" 
- בוחרים סוגי מדיה (עיתונות, דיגיטל, ווטסאפ וכו')
- מזינים תקציב ומקבלים הצעת חבילות מותאמות
- אחרי בחירת חבילה, מקבלים הודעה באזור האישי עם חבילה סופית מפורטת

🏢 **פרופיל עסקי**
- דרך "פרופיל" בתפריט הצדדי
- שם אפשר לעדכן: פרטי קשר, צבעים, פונטים, לוגו, רשתות חברתיות ועוד

📊 **לוח בקרה**
- מציג סיכום: קמפיינים פעילים, סטטוס הזמנות, פעילות אחרונה
- מכאן אפשר לגשת לכל חלקי המערכת

💼 **כרטיס ביקור ונייר מכתבים**
- נגיש דרך הסטודיו הפנימי
- מאפשר יצירת כרטיסי ביקור ונייר מכתבים ממותגים

הנחיות:
- ענה רק על שאלות שקשורות לשימוש במערכת
- אם שואלים שאלה כללית שלא קשורה, אמור בנימוס: "אני כאן כדי לעזור לך להשתמש במערכת ADKOP. מה תרצה לעשות במערכת?"
- תמיד כוון את המשתמש לאן ללחוץ ומה לעשות שלב אחרי שלב
- כתוב בעברית מכובדת וקצרה
- השתמש באימוג'ים למראה ידידותי

${context ? `\nמידע נוכחי על המשתמש:\nעמוד נוכחי: ${context.currentPage || 'לא ידוע'}\nשם עסק: ${context.businessName || 'לא ידוע'}` : ''}`;

    // For single-shot messages (enhance brief, transcribe, etc.), use a simpler system prompt
    const effectiveSystemPrompt = isSingleShot 
      ? 'אתה עוזר AI שעונה בעברית. ענה בקצרה ולעניין.'
      : systemPrompt;

    // Build user message content — include audio if present
    let userContent: any = message || '';
    if (hasAudio && isSingleShot) {
      // Build multimodal content with audio
      const formatMap: Record<string, string> = { 'webm': 'audio/webm', 'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4' };
      const mimeType = formatMap[audioFormat || 'webm'] || 'audio/webm';
      userContent = [
        { type: 'text', text: message || 'תמלל את ההקלטה הזו לטקסט בעברית. תן רק את הטקסט המדובר, בלי הסברים.' },
        { type: 'input_audio', input_audio: { data: audioBase64, format: audioFormat === 'wav' ? 'wav' : 'mp3' } },
      ];
    }

    const chatMessages = isSingleShot
      ? [{ role: 'user', content: userContent }]
      : (Array.isArray(messages) ? messages : []);

    const allMessages = [
      { role: "system", content: effectiveSystemPrompt },
      ...chatMessages,
    ];

    // For audio transcription, go directly to Lovable AI Gateway (supports multimodal)
    // Skip Google direct API as it doesn't support input_audio format easily
    if (hasAudio && LOVABLE_API_KEY) {
      console.log('[ai-chat] Audio transcription mode, using Lovable AI Gateway');
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: allMessages,
          max_completion_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[ai-chat] Audio transcription error:', response.status, errText);
        return new Response(JSON.stringify({ error: 'שגיאה בתמלול', details: errText }), {
          status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({ response: text || 'לא זוהה דיבור' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Google Gemini API first (text-only)
    if (GOOGLE_GEMINI_API_KEY && !hasAudio) {
      try {
        const geminiMessages = allMessages.filter(m => m.role !== 'system');
        const systemText = allMessages.find(m => m.role === 'system')?.content || '';
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemText }] },
              contents: geminiMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
              })),
              generationConfig: { maxOutputTokens: 2048 },
            }),
          }
        );

        if (directResponse.ok) {
          const data = await directResponse.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            if (isSingleShot) {
              return new Response(JSON.stringify({ response: text }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`;
            return new Response(sseData, {
              headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
            });
          }
        }
      } catch (e) {
        console.error('[ai-chat] Google API error:', e);
      }
    }

    // Fallback: Lovable AI Gateway
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "שירות AI אינו זמין" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: allMessages,
        stream: !isSingleShot,
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "הגעת למגבלת הבקשות. נסה שוב בעוד כמה דקות." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נגמרו הקרדיטים." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "שגיאה בתקשורת עם AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single-shot: parse JSON response and return
    if (isSingleShot) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({ response: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
