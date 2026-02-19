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

const STREAM_LABELS: Record<string, string> = {
  hasidic: 'חסידי',
  litvish: 'ליטאי',
  general: 'כללי',
  sephardic: 'ספרדי',
};

const HOLIDAY_LABELS: Record<string, string> = {
  pesach: 'פסח',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  shavuot: 'שבועות',
  lag_baomer: 'ל"ג בעומר',
  tu_bishvat: 'ט"ו בשבט',
  summer: 'קיץ',
  bein_hazmanim: 'בין הזמנים',
  rosh_hashana: 'ראש השנה',
  yom_kippur: 'ימים נוראים',
  year_round: 'כל השנה',
};

const TOPIC_LABELS: Record<string, string> = {
  real_estate: 'נדל"ן',
  beauty: 'ביוטי',
  food: 'מזון',
  cellular: 'סלולר',
  filtered_internet: 'אינטרנט מסונן',
  electronics: 'מוצרי חשמל',
  hotels: 'מלונאות וחופשות',
  mens_fashion: 'אופנה גברית',
  kids_fashion: 'אופנת ילדים',
  womens_fashion: 'אופנת נשים',
  makeup: 'איפור וקוסמטיקה',
  education: 'לימודים וחינוך',
  health: 'בריאות',
  finance: 'פיננסים וביטוח',
  events: 'אירועים ושמחות',
  judaica: 'יודאיקה וספרי קודש',
  toys: 'צעצועים ומשחקים',
  furniture: 'ריהוט ועיצוב הבית',
  jewelry: 'תכשיטים ושעונים',
  other: 'אחר',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check - admin only
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const adminCheck = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: roleData } = await adminCheck.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { insightType = 'general' } = await req.json().catch(() => ({}));
    
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No API key configured');
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
קיבלת גישה לכל החומרים שהועלו למערכת לאימון AI.

עליך לנתח את המידע ולהחזיר תובנות כלליות בלבד על פרסום במגזר החרדי.

חשוב מאוד:
- אל תפרט לפי סוגי מדיה (מודעות, רדיו, וידאו וכו') - זה יגיע בניתוחים נפרדים
- התמקד רק בתובנות שרלוונטיות לכל סוגי הפרסום במגזר

הפורמט הרצוי:

🎯 **עקרונות יסוד לפרסום במגזר החרדי**

כתוב 5-8 תובנות מפתח בפורמט נעים וקריא:

• **כותרת קצרה** - הסבר של 1-2 משפטים

דוגמה:
• **שפה מכבדת ועניינית** - הימנע מסלנג רחוב, מליצות יתר או ארכאיות. דבר אל הקהל בגובה העיניים עם דיסטנס מכובד.

כללים:
- כתוב בעברית מקצועית אך נגישה
- השתמש בנקודות (•) ולא במספרים
- הדגש כותרות בבולד (**)
- התמקד בתובנות אסטרטגיות שחוצות את כל סוגי המדיה
- ציין הבדלים בין זרמים (חסידי, ליטאי, ספרדי) רק אם רלוונטי
- אל תכלול סקשנים נפרדים לכל סוג מדיה`;

      userPrompt = `הנה סיכום התכנים שהועלו למערכת:

📊 סטטיסטיקה:
- דוגמאות: ${examples.length}
- קישורים שנקראו: ${linkContents.length}

📝 כללי אצבע כלליים:
${generalGuidelines.slice(0, 10).join('\n') || 'אין'}

🔗 תוכן מקישורים:
${linkContents.slice(0, 5).map(lc => lc.content.substring(0, 600)).join('\n\n') || 'אין'}

נתח את כל המידע והחזר תובנות כלליות בלבד (ללא חלוקה לפי סוגי מדיה).`;

    } else if (insightType.startsWith('media_')) {
      // Specific media type analysis
      const mediaType = insightType.replace('media_', '');
      const mediaTypeLabel = MEDIA_TYPE_LABELS[mediaType] || mediaType;
      const data = contentByMedia[mediaType];
      const mediaLinks = linkContents.filter(lc => lc.mediaType === mediaType || !lc.mediaType);
      
      const relevantExamples = examples.filter(e => e.media_type === mediaType);
      
      systemPrompt = buildMediaSystemPrompt(mediaTypeLabel);
      userPrompt = buildMediaUserPrompt(relevantExamples, data, mediaLinks, mediaTypeLabel);

    } else if (insightType.startsWith('stream_')) {
      // Stream-specific analysis
      const stream = insightType.replace('stream_', '');
      const streamLabel = STREAM_LABELS[stream] || stream;
      
      const relevantExamples = examples.filter(e => e.stream_type === stream);
      
      systemPrompt = `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון, מתמחה בקהל ה${streamLabel}.
קיבלת גישה לדוגמאות ספציפיות שהועלו למערכת עבור הזרם ה${streamLabel}.

חשוב מאוד - התייחס לדוגמאות ספציפיות!
כשאתה מנתח, ציין במפורש:
- "מהדוגמה של [שם/תוכן הדוגמה] אני רואה ש..."
- "בדוגמה '[ציטוט קצר]' - עובד/לא עובד כי..."

הפורמט הרצוי:

🎯 **תובנות לפרסום לקהל ${streamLabel}**

כתוב 4-6 תובנות, כל אחת בפורמט:

• **כותרת התובנה**
  מהדוגמה "[ציטוט או תיאור]" אני רואה ש[התובנה].
  ✅ עשה: [המלצה ספציפית]
  ❌ אל תעשה: [מה להימנע]

כללים:
- התמקד בהבדלים הייחודיים לזרם ה${streamLabel} מול זרמים אחרים
- ציין נימה, סגנון שפה, ערכים שמדברים לקהל זה
- חובה להתייחס לדוגמאות ספציפיות שקיבלת`;

      userPrompt = buildFilteredUserPrompt(relevantExamples, linkContents, `זרם ${streamLabel}`, 'stream_type', stream);

    } else if (insightType.startsWith('holiday_')) {
      // Holiday-specific analysis
      const holiday = insightType.replace('holiday_', '');
      const holidayLabel = HOLIDAY_LABELS[holiday] || holiday;
      
      const relevantExamples = examples.filter(e => e.holiday_season === holiday);
      
      systemPrompt = `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון, מתמחה בפרסום לתקופת ${holidayLabel}.
קיבלת גישה לדוגמאות ספציפיות שהועלו למערכת עבור ${holidayLabel}.

חשוב מאוד - התייחס לדוגמאות ספציפיות!

הפורמט הרצוי:

🗓️ **תובנות לפרסום ב${holidayLabel}**

כתוב 4-6 תובנות, כל אחת בפורמט:

• **כותרת התובנה**
  מהדוגמה "[ציטוט או תיאור]" אני רואה ש[התובנה].
  ✅ עשה: [המלצה ספציפית]
  ❌ אל תעשה: [מה להימנע]

כללים:
- התמקד בייחודיות של ${holidayLabel} - מסרים, תחושות, צרכים
- ציין טיימינג, מוטיבים, ושפה מתאימה לתקופה
- חובה להתייחס לדוגמאות ספציפיות שקיבלת`;

      userPrompt = buildFilteredUserPrompt(relevantExamples, linkContents, holidayLabel, 'holiday_season', holiday);

    } else if (insightType.startsWith('topic_')) {
      // Topic-specific analysis
      const topic = insightType.replace('topic_', '');
      const topicLabel = TOPIC_LABELS[topic] || topic;
      
      const relevantExamples = examples.filter(e => e.topic_category === topic);
      
      systemPrompt = `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון, מתמחה בתחום ${topicLabel}.
קיבלת גישה לדוגמאות ספציפיות שהועלו למערכת עבור תחום ${topicLabel}.

חשוב מאוד - התייחס לדוגמאות ספציפיות!

הפורמט הרצוי:

🏷️ **תובנות לפרסום בתחום ${topicLabel}**

כתוב 4-6 תובנות, כל אחת בפורמט:

• **כותרת התובנה**
  מהדוגמה "[ציטוט או תיאור]" אני רואה ש[התובנה].
  ✅ עשה: [המלצה ספציפית]
  ❌ אל תעשה: [מה להימנע]

כללים:
- התמקד באסטרטגיות שעובדות בתחום ${topicLabel} במגזר החרדי
- ציין מה עובד/לא עובד ספציפית בתחום הזה
- חובה להתייחס לדוגמאות ספציפיות שקיבלת`;

      userPrompt = buildFilteredUserPrompt(relevantExamples, linkContents, `תחום ${topicLabel}`, 'topic_category', topic);

    } else {
      // Fallback for old media type format (backwards compatibility)
      const mediaTypeLabel = MEDIA_TYPE_LABELS[insightType] || insightType;
      const data = contentByMedia[insightType];
      const mediaLinks = linkContents.filter(lc => lc.mediaType === insightType || !lc.mediaType);
      const relevantExamples = examples.filter(e => e.media_type === insightType);
      
      systemPrompt = buildMediaSystemPrompt(mediaTypeLabel);
      userPrompt = buildMediaUserPrompt(relevantExamples, data, mediaLinks, mediaTypeLabel);
    }

    console.log(`Built prompts for ${insightType}. System prompt length: ${systemPrompt.length}, User prompt length: ${userPrompt.length}`);

    // Get image URLs for vision analysis
    const imageExamples = examples.filter(e => 
      e.file_type?.startsWith('image/') && e.file_path
    ).slice(0, 10); // Limit to 10 images to avoid token limits
    
    console.log(`Found ${imageExamples.length} images for vision analysis`);
    
    // Build message content with images
    const userContent: any[] = [];
    
    // Add text content first
    userContent.push({
      type: "text",
      text: userPrompt
    });
    
    // Add images for visual analysis
    if (imageExamples.length > 0) {
      const imageIntro = `\n\n🖼️ **תמונות לניתוח ויזואלי (${imageExamples.length} תמונות):**\nלהלן התמונות שהועלו. נתח כל תמונה ויזואלית והסק תובנות ספציפיות מכל אחת.`;
      userContent.push({
        type: "text",
        text: imageIntro
      });
      
      for (const img of imageExamples) {
        // Add image label
        const imgLabel = `תמונה: "${img.name}" ${img.example_type === 'good' ? '(דוגמה טובה)' : img.example_type === 'bad' ? '(דוגמה רעה)' : ''} ${img.description ? `- ${img.description}` : ''}`;
        userContent.push({
          type: "text",
          text: imgLabel
        });
        
        // Add the image - Supabase storage URLs (encode path segments for Hebrew filenames)
        let imageUrl: string;
        if (img.file_path.startsWith('http')) {
          // Re-encode the path portion of existing URLs to handle Hebrew chars
          try {
            const parsed = new URL(img.file_path);
            parsed.pathname = parsed.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
            imageUrl = parsed.toString();
          } catch {
            imageUrl = img.file_path;
          }
        } else {
          const encodedPath = img.file_path.split('/').map(segment => encodeURIComponent(segment)).join('/');
          imageUrl = `${SUPABASE_URL}/storage/v1/object/public/sector-brain/${encodedPath}`;
        }
        
        userContent.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
        
        console.log(`Added image for analysis: ${img.name} - ${imageUrl}`);
      }
    }

    // Build text-only content (image URLs cause errors in both Google API and Gateway)
    const textOnlyPrompt = userContent
      .filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('\n\n');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'שירות AI אינו זמין כרגע' }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Using Lovable AI Gateway (text-only)...');
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
          { role: "user", content: textOnlyPrompt },
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "שגיאה בתקשורת עם AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

// Helper functions for building prompts
function buildMediaSystemPrompt(mediaTypeLabel: string): string {
  return `אתה מומחה בכיר לפרסום במגזר החרדי עם 20 שנות ניסיון, מתמחה ב${mediaTypeLabel}.
קיבלת גישה לדוגמאות ספציפיות שהועלו למערכת.

חשוב מאוד - התייחס לדוגמאות ספציפיות!
כשאתה מנתח, ציין במפורש:
- "מהדוגמה של [שם/תוכן הדוגמה] אני רואה ש..."
- "בדוגמה הטובה '[ציטוט קצר]' - עובד כי..."
- "בדוגמה הרעה '[ציטוט קצר]' - הבעיה היא..."

הפורמט הרצוי:

📰 **תובנות ל${mediaTypeLabel}**

כתוב 4-6 תובנות, כל אחת בפורמט:

• **כותרת התובנה**
  מהדוגמה "[ציטוט או תיאור]" אני רואה ש[התובנה].
  ✅ עשה: [המלצה ספציפית]
  ❌ אל תעשה: [מה להימנע]

כללים:
- חובה להתייחס לדוגמאות ספציפיות שקיבלת בשמן או בציטוט
- אם יש דוגמאות טובות - ציין מה בדיוק עובד בכל אחת
- אם יש דוגמאות רעות - הסבר מה הבעיה הספציפית
- כתוב בעברית מקצועית אך נגישה
- אם אין מספיק דוגמאות, ציין זאת`;
}

function buildMediaUserPrompt(relevantExamples: any[], data: any, mediaLinks: any[], mediaTypeLabel: string): string {
  const goodExamplesDetailed = relevantExamples
    .filter(e => e.example_type === 'good' && !e.is_general_guideline)
    .slice(0, 15)
    .map((e: any, i: number) => formatExample(e, i));

  const badExamplesDetailed = relevantExamples
    .filter(e => e.example_type === 'bad' && !e.is_general_guideline)
    .slice(0, 15)
    .map((e: any, i: number) => formatExample(e, i));

  const neutralExamples = relevantExamples
    .filter(e => !e.example_type && !e.is_general_guideline)
    .slice(0, 10)
    .map((e: any, i: number) => formatExample(e, i));

  return `הנה כל הדוגמאות והמידע על ${mediaTypeLabel}:

📊 סטטיסטיקה:
- סה"כ דוגמאות מקבצים: ${relevantExamples.length}
- דוגמאות טובות: ${goodExamplesDetailed.length}
- דוגמאות רעות: ${badExamplesDetailed.length}
- דוגמאות נוספות מקבצים: ${neutralExamples.length}
- כללי אצבע: ${data?.guidelines?.length || 0}
- קישורים: ${mediaLinks.length}

📝 כללי אצבע ל${mediaTypeLabel}:
${data?.guidelines?.slice(0, 10).join('\n') || 'אין כללים ספציפיים'}

📁 **דוגמאות מקבצים שהועלו - התייחס לשמות ולתיאורים!**

✅ דוגמאות טובות (חובה להתייחס בשמן):
${goodExamplesDetailed.join('\n\n') || 'אין דוגמאות טובות'}

❌ דוגמאות רעות (חובה להתייחס בשמן):
${badExamplesDetailed.join('\n\n') || 'אין דוגמאות רעות'}

📄 דוגמאות נוספות מקבצים:
${neutralExamples.join('\n\n') || 'אין'}

🔗 **תוכן מקישורים:**
${mediaLinks.slice(0, 4).map(lc => `מתוך ${lc.url}:\n${lc.content.substring(0, 500)}`).join('\n\n') || 'אין קישורים'}

🎯 חשוב: נתח את כל המקורות - גם הקבצים שהועלו וגם הקישורים. התייחס לכל דוגמה בשמה!`;
}

function buildFilteredUserPrompt(relevantExamples: any[], linkContents: any[], filterLabel: string, filterField: string, filterValue: string): string {
  const goodExamples = relevantExamples
    .filter(e => e.example_type === 'good' && !e.is_general_guideline)
    .slice(0, 15)
    .map((e: any, i: number) => formatExample(e, i));

  const badExamples = relevantExamples
    .filter(e => e.example_type === 'bad' && !e.is_general_guideline)
    .slice(0, 15)
    .map((e: any, i: number) => formatExample(e, i));

  const neutralExamples = relevantExamples
    .filter(e => !e.example_type && !e.is_general_guideline)
    .slice(0, 10)
    .map((e: any, i: number) => formatExample(e, i));

  return `הנה כל הדוגמאות והמידע עבור ${filterLabel}:

📊 סטטיסטיקה:
- סה"כ דוגמאות: ${relevantExamples.length}
- דוגמאות טובות: ${goodExamples.length}
- דוגמאות רעות: ${badExamples.length}
- דוגמאות נוספות: ${neutralExamples.length}

📁 **דוגמאות - התייחס לשמות ולתיאורים!**

✅ דוגמאות טובות:
${goodExamples.join('\n\n') || 'אין דוגמאות טובות'}

❌ דוגמאות רעות:
${badExamples.join('\n\n') || 'אין דוגמאות רעות'}

📄 דוגמאות נוספות:
${neutralExamples.join('\n\n') || 'אין'}

🔗 **תוכן מקישורים:**
${linkContents.slice(0, 4).map(lc => `מתוך ${lc.url}:\n${lc.content.substring(0, 500)}`).join('\n\n') || 'אין קישורים'}

🎯 נתח את כל הדוגמאות והחזר תובנות עם התייחסות ישירה לכל דוגמה.
${relevantExamples.length === 0 ? `\n⚠️ שים לב: אין עדיין דוגמאות מסומנות עבור ${filterLabel}. נסה להסיק מהמידע הכללי.` : ''}`;
}

function formatExample(e: any, i: number): string {
  const parts = [];
  if (e.name) parts.push(`**"${e.name}"**`);
  if (e.description) parts.push(`תיאור: ${e.description}`);
  if (e.text_content) parts.push(`תוכן: "${e.text_content.substring(0, 300)}"`);
  if (e.topic_category) parts.push(`נושא: ${e.topic_category}`);
  if (e.stream_type) parts.push(`זרם: ${e.stream_type}`);
  if (e.gender_audience) parts.push(`קהל: ${e.gender_audience}`);
  if (e.holiday_season) parts.push(`עונה/חג: ${e.holiday_season}`);
  if (e.media_type) parts.push(`מדיה: ${e.media_type}`);
  if (e.file_type) parts.push(`סוג קובץ: ${e.file_type}`);
  return `${i+1}. ${parts.join(' | ')}`; 
}
