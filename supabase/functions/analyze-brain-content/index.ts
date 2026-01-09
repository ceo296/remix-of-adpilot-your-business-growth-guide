import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      supabase.from('sector_brain_examples').select('*').order('created_at', { ascending: false }).limit(100),
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

    // Build summary of content
    const contentSummary = {
      totalExamples: examples.length,
      totalLinks: links.length,
      guidelines: examples.filter(e => e.is_general_guideline).map(e => ({
        text: e.text_content,
        mediaType: e.media_type
      })),
      textExamples: examples.filter(e => e.file_type === 'text' && !e.is_general_guideline).map(e => ({
        text: e.text_content,
        type: e.example_type,
        mediaType: e.media_type,
        stream: e.stream_type,
        topic: e.topic_category
      })),
      imageExamples: examples.filter(e => e.file_type?.startsWith('image/')).map(e => ({
        name: e.name,
        type: e.example_type,
        mediaType: e.media_type
      })),
      links: links.map(l => l.url),
      mediaTypeBreakdown: {} as Record<string, number>
    };

    // Count by media type
    examples.forEach(e => {
      if (e.media_type) {
        contentSummary.mediaTypeBreakdown[e.media_type] = (contentSummary.mediaTypeBreakdown[e.media_type] || 0) + 1;
      }
    });

    const systemPrompt = `אתה מומחה לפרסום במגזר החרדי. 
קיבלת גישה לכל החומרים שהועלו למערכת ללימוד AI - דוגמאות טובות, דוגמאות רעות, כללי אצבע, וקישורים רלוונטיים.

תפקידך לנתח את כל המידע ולהציג תובנות חכמות ושימושיות:
1. מה אפשר ללמוד מהדוגמאות הטובות?
2. מה הטעויות הנפוצות שרואים בדוגמאות הרעות?
3. מה הסגנון והטון המומלץ לפי הכללים שהוגדרו?
4. מה הדפוסים שחוזרים על עצמם?
5. המלצות לשיפור

כתוב בעברית, בסגנון מקצועי אך נגיש.
אל תפרט יותר מדי - תן תובנות ממוקדות ושימושיות.`;

    const userPrompt = `הנה סיכום התכנים שהועלו למערכת:

📊 סטטיסטיקה:
- סה"כ דוגמאות: ${contentSummary.totalExamples}
- סה"כ קישורים: ${contentSummary.totalLinks}
- התפלגות לפי סוג מדיה: ${JSON.stringify(contentSummary.mediaTypeBreakdown)}

📝 כללי אצבע שהוגדרו (${contentSummary.guidelines.length}):
${contentSummary.guidelines.slice(0, 10).map(g => `- ${g.text}`).join('\n') || 'אין כללים עדיין'}

✅ דוגמאות טקסט טובות (${contentSummary.textExamples.filter(e => e.type === 'good').length}):
${contentSummary.textExamples.filter(e => e.type === 'good').slice(0, 5).map(e => `- "${e.text?.substring(0, 100)}..." (${e.topic || 'כללי'})`).join('\n') || 'אין דוגמאות עדיין'}

❌ דוגמאות טקסט רעות (${contentSummary.textExamples.filter(e => e.type === 'bad').length}):
${contentSummary.textExamples.filter(e => e.type === 'bad').slice(0, 5).map(e => `- "${e.text?.substring(0, 100)}..." (${e.topic || 'כללי'})`).join('\n') || 'אין דוגמאות עדיין'}

🖼️ דוגמאות תמונה (${contentSummary.imageExamples.length}):
${contentSummary.imageExamples.slice(0, 5).map(e => `- ${e.name} (${e.type === 'good' ? 'טוב' : 'רע'})`).join('\n') || 'אין תמונות עדיין'}

🔗 קישורים (${contentSummary.links.length}):
${contentSummary.links.slice(0, 5).join('\n') || 'אין קישורים עדיין'}

נתח את המידע הזה והצג תובנות שימושיות.`;

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
