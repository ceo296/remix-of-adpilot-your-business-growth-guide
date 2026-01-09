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
    const { insightType = 'general' } = await req.json().catch(() => ({}));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    console.log(`Analyzing content for insight type: ${insightType}`);

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

    // Fetch content from links
    console.log(`Fetching content from ${links.length} links...`);
    const linkContents: Array<{ url: string; mediaType: string | null; content: string }> = [];
    
    for (const link of links.slice(0, 10)) { // Limit to 10 links to avoid timeout
      try {
        console.log(`Fetching: ${link.url}`);
        const response = await fetch(link.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SectorBrainBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout per link
        });
        
        if (response.ok) {
          const html = await response.text();
          // Extract text content from HTML (basic extraction)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000); // Limit content length
          
          linkContents.push({
            url: link.url,
            mediaType: link.media_type,
            content: textContent,
          });
          console.log(`Successfully fetched ${link.url}: ${textContent.substring(0, 100)}...`);
        } else {
          console.log(`Failed to fetch ${link.url}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error fetching ${link.url}:`, error);
      }
    }

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

    // Build different prompts based on insight type
    let systemPrompt = '';
    let userPrompt = '';
    
    const mediaTypeLabel = MEDIA_TYPE_LABELS[insightType] || insightType;
    
    if (insightType === 'general') {
      systemPrompt = `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון.
קיבלת גישה לכל החומרים שהועלו למערכת לאימון AI - דוגמאות טובות, דוגמאות רעות, כללי אצבע, וקישורים.

עליך לנתח את המידע ולהחזיר תובנות כלליות על פרסום במגזר החרדי.

הפורמט:
## 🎯 תובנות כלליות על פרסום במגזר החרדי

כתוב 5-8 תובנות מפתח על פרסום במגזר החרדי בכלל. התובנות צריכות להיות:
- פרקטיות ושימושיות
- מבוססות על הדוגמאות שקיבלת
- מותאמות למגזר החרדי ולרגישויותיו
- כוללות עשה/אל תעשה ספציפיים

כללים:
- כתוב בעברית מקצועית אך נגישה
- התמקד בתובנות אסטרטגיות שחוצות את כל סוגי המדיה
- הדגש הבדלים בין זרמים (חסידי, ליטאי, ספרדי) אם רלוונטי
- ציין קווים אדומים חשובים`;

      userPrompt = `הנה סיכום התכנים שהועלו למערכת:

📊 סטטיסטיקה כללית:
- סה"כ דוגמאות: ${examples.length}
- סה"כ קישורים: ${links.length}
- קישורים שנקראו בהצלחה: ${linkContents.length}

📝 כללי אצבע כלליים (${generalGuidelines.length}):
${generalGuidelines.slice(0, 10).join('\n') || 'אין'}

🔗 תוכן מקישורים (${linkContents.length}):
${linkContents.slice(0, 5).map(lc => `
--- קישור: ${lc.url} ---
${lc.content.substring(0, 800)}
`).join('\n') || 'לא נמצא תוכן בקישורים'}

📊 סיכום לפי סוגי מדיה:
${mediaTypes.map(mt => {
  const data = contentByMedia[mt];
  return `${data.label}: ${data.goodExamples.length} דוגמאות טובות, ${data.badExamples.length} דוגמאות רעות, ${data.guidelines.length} כללים`;
}).join('\n')}

נתח את כל המידע והחזר תובנות כלליות על פרסום במגזר החרדי.`;

    } else {
      // Specific media type analysis
      const data = contentByMedia[insightType];
      const mediaLinks = linkContents.filter(lc => lc.mediaType === insightType || !lc.mediaType);
      
      systemPrompt = `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון, מתמחה ב${mediaTypeLabel}.
קיבלת גישה לדוגמאות טובות ורעות, כללי אצבע, וקישורים הקשורים ל${mediaTypeLabel}.

עליך לנתח את המידע ולהחזיר תובנות ספציפיות ל${mediaTypeLabel}.

הפורמט:
## ${mediaTypeLabel === 'מודעות' ? '📰' : mediaTypeLabel === 'מלל וקופי' ? '✍️' : mediaTypeLabel === 'וידאו' ? '🎬' : mediaTypeLabel === 'שילוט' ? '🪧' : mediaTypeLabel === 'קד"מ' ? '📢' : '📻'} תובנות ל${mediaTypeLabel}

כתוב 5-8 תובנות ספציפיות ל${mediaTypeLabel}. כל תובנה צריכה להיות:
- פרקטית ומיידית ליישום
- מבוססת על הדוגמאות הקונקרטיות שקיבלת
- כוללת "עשה" ו"אל תעשה" ספציפיים
- מתייחסת לנורמות המגזר החרדי

אם יש דוגמאות טובות - הסבר מה עובד בהן ולמה
אם יש דוגמאות רעות - הסבר מה לא עובד ואיך לתקן
אם יש כללי אצבע - הרחב עליהם עם דוגמאות

כללים:
- כתוב בעברית מקצועית אך נגישה
- התמקד בפרקטיקה של ${mediaTypeLabel}
- אם אין מספיק מידע, ציין זאת וספק עצות כלליות מניסיונך`;

      userPrompt = `הנה כל המידע על ${mediaTypeLabel}:

📊 סטטיסטיקה:
- דוגמאות טובות: ${data?.goodExamples?.length || 0}
- דוגמאות רעות: ${data?.badExamples?.length || 0}
- כללי אצבע ספציפיים: ${data?.guidelines?.length || 0}
- תמונות: ${data?.imageCount || 0}
- קישורים רלוונטיים: ${mediaLinks.length}

📝 כללי אצבע ל${mediaTypeLabel}:
${data?.guidelines?.slice(0, 10).join('\n') || 'אין כללים ספציפיים'}

✅ דוגמאות טובות:
${data?.goodExamples?.slice(0, 5).map((e: any, i: number) => `${i+1}. "${e.text || 'ללא טקסט'}" ${e.topic ? `(נושא: ${e.topic})` : ''} ${e.stream ? `(זרם: ${e.stream})` : ''}`).join('\n') || 'אין דוגמאות'}

❌ דוגמאות רעות:
${data?.badExamples?.slice(0, 5).map((e: any, i: number) => `${i+1}. "${e.text || 'ללא טקסט'}" ${e.topic ? `(נושא: ${e.topic})` : ''}`).join('\n') || 'אין דוגמאות'}

🔗 תוכן מקישורים רלוונטיים:
${mediaLinks.slice(0, 5).map(lc => `
--- מתוך: ${lc.url} ---
${lc.content.substring(0, 600)}
`).join('\n') || 'אין קישורים'}

📝 כללי אצבע כלליים (לרקע):
${generalGuidelines.slice(0, 5).join('\n') || 'אין'}

נתח את כל המידע והחזר תובנות ספציפיות ל${mediaTypeLabel}.`;
    }

    console.log(`Built prompts for ${insightType}. System prompt length: ${systemPrompt.length}, User prompt length: ${userPrompt.length}`);

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
