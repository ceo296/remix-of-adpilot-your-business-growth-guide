import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
  ads: 'מודעות',
  text: 'מלל וקופי',
  video: 'וידאו',
  signage: 'שילוט',
  promo: 'קד"מ',
  radio: 'רדיו',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch all examples and links
    const [examplesRes, linksRes] = await Promise.all([
      supabase.from('sector_brain_examples').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('sector_brain_links').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (examplesRes.error) {
      console.error('Error fetching examples:', examplesRes.error);
    }
    if (linksRes.error) {
      console.error('Error fetching links:', linksRes.error);
    }

    const examples = examplesRes.data || [];
    const links = linksRes.data || [];

    // Build content by media type
    const mediaTypes = ['ads', 'text', 'video', 'signage', 'promo', 'radio'];
    const contentByMedia: Record<string, any> = {};
    
    mediaTypes.forEach(mt => {
      const mediaExamples = examples.filter(e => e.media_type === mt);
      contentByMedia[mt] = {
        label: MEDIA_TYPE_LABELS[mt],
        guidelines: mediaExamples.filter(e => e.is_general_guideline).map(e => e.text_content),
        goodExamples: mediaExamples.filter(e => e.example_type === 'good' && !e.is_general_guideline).map(e => ({
          text: e.text_content,
          topic: e.topic_category,
          stream: e.stream_type
        })),
        badExamples: mediaExamples.filter(e => e.example_type === 'bad' && !e.is_general_guideline).map(e => ({
          text: e.text_content,
          topic: e.topic_category
        })),
        imageCount: mediaExamples.filter(e => e.file_type?.startsWith('image/')).length
      };
    });

    // General content (no media type)
    const generalGuidelines = examples.filter(e => e.is_general_guideline && !e.media_type).map(e => e.text_content);

    const systemPrompt = `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון.
קיבלת גישה לכל החומרים שהועלו למערכת לאימון AI - דוגמאות טובות, דוגמאות רעות, כללי אצבע, וקישורים.

עליך לנתח את המידע ולהחזיר תובנות מובנות בפורמט הבא בדיוק:

## 🎯 תובנות כלליות על פרסום במגזר החרדי

[כתוב 3-5 תובנות מפתח על פרסום במגזר החרדי בכלל, בהתבסס על כל החומר שקיבלת]

## 📰 תובנות למודעות (ads)

[אם יש תוכן למודעות - כתוב 2-3 תובנות ספציפיות. אם אין - כתוב "אין מספיק תוכן לניתוח"]

## ✍️ תובנות למלל וקופי (text)

[אם יש תוכן לטקסט - כתוב 2-3 תובנות ספציפיות. אם אין - כתוב "אין מספיק תוכן לניתוח"]

## 🎬 תובנות לוידאו (video)

[אם יש תוכן לוידאו - כתוב 2-3 תובנות ספציפיות. אם אין - כתוב "אין מספיק תוכן לניתוח"]

## 🪧 תובנות לשילוט (signage)

[אם יש תוכן לשילוט - כתוב 2-3 תובנות ספציפיות. אם אין - כתוב "אין מספיק תוכן לניתוח"]

## 📢 תובנות לקד"מ (promo)

[אם יש תוכן לקד"מ - כתוב 2-3 תובנות ספציפיות. אם אין - כתוב "אין מספיק תוכן לניתוח"]

## 📻 תובנות לרדיו (radio)

[אם יש תוכן לרדיו - כתוב 2-3 תובנות ספציפיות. אם אין - כתוב "אין מספיק תוכן לניתוח"]

כללים חשובים:
- כתוב בעברית מקצועית אך נגישה
- התמקד בתובנות פרקטיות ושימושיות
- השתמש באמוג'י בתחילת כל כותרת
- אם אין מספיק מידע לסוג מדיה מסוים, ציין זאת בקצרה`;

    const userPrompt = `הנה סיכום התכנים שהועלו למערכת:

📊 סטטיסטיקה כללית:
- סה"כ דוגמאות: ${examples.length}
- סה"כ קישורים: ${links.length}

📝 כללי אצבע כלליים (${generalGuidelines.length}):
${generalGuidelines.slice(0, 5).join('\n') || 'אין'}

🔗 קישורים כלליים (${links.length}):
${links.slice(0, 5).map(l => l.url).join('\n') || 'אין'}

${mediaTypes.map(mt => {
  const data = contentByMedia[mt];
  return `
--- ${data.label} (${mt}) ---
כללי אצבע: ${data.guidelines.length}
${data.guidelines.slice(0, 3).join(' | ') || '-'}

דוגמאות טובות: ${data.goodExamples.length}
${data.goodExamples.slice(0, 2).map((e: any) => `"${e.text?.substring(0, 80)}..."`).join('\n') || '-'}

דוגמאות רעות: ${data.badExamples.length}
${data.badExamples.slice(0, 2).map((e: any) => `"${e.text?.substring(0, 80)}..."`).join('\n') || '-'}

תמונות: ${data.imageCount}
`;
}).join('\n')}

נתח את כל המידע והחזר תובנות מובנות לפי הפורמט שקיבלת.`;

    console.log('Sending analysis request to AI...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
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
        error: "שגיאה בתקשורת עם AI" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in analyze-brain-content function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "שגיאה לא צפויה" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
