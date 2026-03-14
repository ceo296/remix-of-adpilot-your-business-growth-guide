import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Topic detection from file name — ORDER MATTERS: specific topics FIRST, fashion LAST
const TOPIC_HINTS: [RegExp, string][] = [
  // Specific topics that may contain "ילדים/נשים/גברים" in context
  [/רפואה|רופא|דוקטור|שיפר|השתל|רפואי|קליני|בריאות|נתי רוקח|רפואת/i, 'health'],
  [/לימודים|סדנ[אה]|קורס|בצלאל|סמינר|חינוך|ישיבה|כולל|השלוחה|תקשורת|אורות|מכללה/i, 'education'],
  [/נדל["\u0022\u201D]?ן|real.?estate|דירות|פרויקט.*מגורים|גוד נדל|נתיב|שכונ/i, 'real_estate'],
  [/סלולר|גלקסי|סמסונג|טלפון|אייפון/i, 'cellular'],
  [/אקטיב הד/i, 'education'],
  [/ביטוח|פיננס|השקעות|משכנתא/i, 'finance'],
  [/מלון|hotel|נופש|צימר/i, 'hotels'],
  [/ריהוט|רהיט|עיצוב הבית|איקאה/i, 'furniture'],
  [/מזון|אוכל|מסעדה|קייטרינג/i, 'food'],
  [/ביוטי|טיפוח|קוסמטיקה/i, 'beauty'],
  [/איפור|מייקאפ/i, 'makeup'],
  [/אירוע|שמחה|חתונה|בר.?מצווה/i, 'events'],
  [/תכשיט|שעון|כלי כסף/i, 'jewelry'],
  [/פאה|פאות|שיער/i, 'wigs'],
  [/צעצוע|משחק/i, 'toys'],
  [/יודאיקה|ספר.?קודש/i, 'judaica'],
  [/חשמל|אלקטרוני/i, 'electronics'],
  [/מיתוג|branding|לוגו/i, 'branding'],
  // Fashion — LAST, only match explicit fashion context
  [/אופנ[הת].*ילד|kids.?fashion|בגדי ילדים/i, 'kids_fashion'],
  [/אופנ[הת].*נש|womens?.?fashion/i, 'womens_fashion'],
  [/אופנ[הת].*גבר|mens?.?fashion|גוביק/i, 'mens_fashion'],
];

// Media type detection from file name (for text files)
const MEDIA_HINTS: [RegExp, string][] = [
  [/תשדיר|ג\'ינגל|תוכנית רדיו|^רדיו /i, 'radio_script'],
  [/מודעה|מודעת|מלל למודע|אופציות.*מודע|קופי|טקסט.*מודע/i, 'ad_copy'],
  [/באנר|banner/i, 'banner_copy'],
  [/אסטרטגי|strategy|מבט אסטרטגי/i, 'strategy'],
  [/בריף|brief|תדריך/i, 'brief'],
  [/כתבה|כתבות|מאמר|טור|article|יחצ/i, 'article'],
  [/דף נחיתה|landing/i, 'landing_page'],
  [/סטוריבורד|storyboard|סרטון/i, 'video_script'],
  [/תסריט שיחה|סקריפט שיחה/i, 'sales_script'],
  [/הסכם|חוזה|contract/i, 'contract'],
  [/שאלון|survey/i, 'survey'],
  [/ברכה|greeting/i, 'greeting'],
  [/פלאייר|flyer/i, 'flyer_copy'],
  [/פרוספקט|prospectus|קטלוג/i, 'prospectus'],
  [/דף מסרים|מסרים/i, 'ad_copy'],
  [/אפיון/i, 'brief'],
  [/המכרז|הזמנה/i, 'ad_copy'],
  [/השקה/i, 'ad_copy'],
];

const HOLIDAY_HINTS: [RegExp, string][] = [
  [/פסח/i, 'pesach'],
  [/חנוכה/i, 'chanukah'],
  [/פורים/i, 'purim'],
  [/סוכות/i, 'sukkot'],
  [/שבועות/i, 'shavuot'],
  [/ראש השנה/i, 'rosh_hashana'],
  [/אלול/i, 'rosh_hashana'],
  [/בין הזמנים|בין המצרים/i, 'bein_hazmanim'],
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL records with pagination (bypass 1000 limit)
    let allRecords: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page, error: pageError } = await supabase
        .from('sector_brain_examples')
        .select('id, name, file_type, topic_category, media_type, holiday_season')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (pageError) throw pageError;
      if (page) allRecords = [...allRecords, ...page];
      if (!page || page.length < pageSize) break;
      from += pageSize;
    }
    const records = allRecords;

    let updated = 0;
    let changes: { id: string; name: string; oldTopic: string | null; newTopic: string | null; oldMedia: string | null; newMedia: string | null }[] = [];

    for (const record of records || []) {
      const fn = record.name.toLowerCase();
      const isTextFile = record.file_type?.includes('word') || record.file_type?.includes('msword')
        || record.name.endsWith('.docx') || record.name.endsWith('.doc') || record.name.endsWith('.txt');

      let newTopic = record.topic_category;
      let newMedia = record.media_type;
      let newHoliday = record.holiday_season;
      let changed = false;

      // Re-detect topic from file name
      let topicDetected = false;
      for (const [regex, val] of TOPIC_HINTS) {
        if (regex.test(fn)) {
          if (newTopic !== val) {
            newTopic = val;
            changed = true;
          }
          topicDetected = true;
          break;
        }
      }
      // If no topic detected from filename and current topic seems wrong
      // (e.g. article about health stuck in kids_fashion), clear it
      if (!topicDetected && newTopic) {
        // Keep topic only if it's a fashion category that could come from folder name
        // For text files (articles, copy etc.), clear suspicious topic assignments
        if (isTextFile) {
          newTopic = null;
          changed = true;
        }
      }

      // Re-detect media type for text files
      if (isTextFile) {
        let detectedMedia = 'copy'; // default for text
        for (const [regex, val] of MEDIA_HINTS) {
          if (regex.test(fn)) { detectedMedia = val; break; }
        }
        if (newMedia !== detectedMedia) {
          newMedia = detectedMedia;
          changed = true;
        }
      }

      // Detect holiday
      if (!record.holiday_season) {
        for (const [regex, val] of HOLIDAY_HINTS) {
          if (regex.test(fn)) { newHoliday = val; changed = true; break; }
        }
      }

      if (changed) {
        const updateData: Record<string, string | null> = {};
        if (newTopic !== record.topic_category) updateData.topic_category = newTopic;
        if (newMedia !== record.media_type) updateData.media_type = newMedia;
        if (newHoliday !== record.holiday_season) updateData.holiday_season = newHoliday;

        await supabase.from('sector_brain_examples').update(updateData).eq('id', record.id);
        updated++;
        changes.push({
          id: record.id,
          name: record.name,
          oldTopic: record.topic_category,
          newTopic,
          oldMedia: record.media_type,
          newMedia,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_records: records?.length || 0,
      updated,
      changes: changes.slice(0, 50), // first 50 for preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
