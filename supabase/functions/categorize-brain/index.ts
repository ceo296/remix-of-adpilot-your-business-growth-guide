import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Keyword-based categorization rules — ordered by specificity (most specific first)
const CATEGORY_RULES: { category: string; keywords: string[]; fileKeywords?: string[] }[] = [
  // Health — must come before generic terms
  { category: 'health', keywords: ['מכבי', 'קופת חולים', 'רפואה', 'רופא', 'בריאות', 'טיפול רפואי', 'מרפאה', 'בית חולים', 'שיניים', 'דנט', 'אורתופד', 'גסטרו', 'אורולוג', 'גינקולוג', 'פסיכיאטר', 'עיניים', 'אסותא', 'הדסה', 'שערי צדק', 'מאוחדת', 'לאומית', 'כללית', 'בריאטרי', 'גמילה', 'עישון', 'צום', 'דיאטה קלינית', 'פיזיותרפיה', 'ביטוח לאומי'], fileKeywords: ['מכבי', 'דנט', 'בריאות', 'רפואה', 'אסותא'] },
  { category: 'education', keywords: ['אורות ישראל', 'סמינר', 'תואר', 'אקדמי', 'לימודים', 'קולג', 'מכללה', 'אוניברסיט', 'ישיבה', 'כולל', 'חינוך', 'הרצאה', 'קורס', 'הכשרה', 'תעודה', 'הסמכה'], fileKeywords: ['אורות', 'סמינר', 'תואר', 'לימודים', 'מכללה'] },
  { category: 'real_estate', keywords: ['דירה', 'דירות', 'נדל"ן', 'פרויקט', 'בנייה', 'קבלן', 'פינוי בינוי', 'תמ"א', 'משכנתא', 'רכישה', 'דיור', 'מגדל', 'שכונה', 'קומה', 'חדרים'], fileKeywords: ['נדלן', 'דירה', 'פרויקט', 'פינוי', 'בינוי', 'פרוספקט'] },
  { category: 'furniture', keywords: ['איקאה', 'ikea', 'רהיט', 'ספה', 'שולחן', 'מזרן', 'מטבח', 'ארון', 'מיטה', 'כיסא', 'ריהוט'], fileKeywords: ['איקאה', 'ikea', 'רהיט'] },
  { category: 'food', keywords: ['מזון', 'מסעדה', 'קייטרינג', 'מאפה', 'בשר', 'עוף', 'דג', 'חלבי', 'בשרי', 'פיצה', 'סושי', 'מאכל', 'תפריט', 'אוכל', 'כשרות', 'בד"ץ', 'צ\'יטוס', 'ציטוס', 'חטיף', 'ממתק', 'שוקולד', 'עוגה', 'קפה'], fileKeywords: ['ציטוס', 'צ\'יטוס', 'אוכל', 'מסעדה', 'קייטרינג'] },
  { category: 'hotels', keywords: ['מלון', 'צימר', 'נופש', 'חופשה', 'בין הזמנים', 'שבת במלון', 'ריזורט', 'ספא', 'בריכה', 'suite', 'סוויטה'], fileKeywords: ['מלון', 'צימר', 'נופש', 'הרלבד'] },
  { category: 'wigs', keywords: ['פאה', 'פאות', 'פאנית', 'שיער טבעי', 'תוספות שיער', 'סלון פאות'], fileKeywords: ['פאה', 'פאות'] },
  { category: 'beauty', keywords: ['קוסמטיקה', 'טיפוח', 'מייקאפ', 'איפור', 'לק', 'ציפורניים', 'סלון יופי', 'ביוטי'], fileKeywords: ['יופי', 'ביוטי', 'קוסמטי'] },
  { category: 'makeup', keywords: ['מייקאפ', 'איפור', 'קונסילר', 'שפתון', 'ריסים', 'פנים'], fileKeywords: ['מייקאפ', 'איפור'] },
  { category: 'jewelry', keywords: ['תכשיט', 'טבעת', 'שרשרת', 'זהב', 'יהלום', 'עגיל', 'צמיד'], fileKeywords: ['תכשיט', 'זהב'] },
  { category: 'womens_fashion', keywords: ['שמלה', 'חצאית', 'בגדי נשים', 'אופנת נשים', 'קולקציה נשית'], fileKeywords: ['אופנה נשים', 'שמלה'] },
  { category: 'mens_fashion', keywords: ['חליפה', 'חולצה לגבר', 'בגדי גברים', 'כובע'], fileKeywords: ['חליפה', 'גברים'] },
  { category: 'kids_fashion', keywords: ['בגדי ילדים', 'תינוק', 'נעלי ילדים', 'ילדים ונוער'], fileKeywords: ['ילדים', 'תינוק', 'נעלי ילדים', 'פונפונו'] },
  { category: 'events', keywords: ['אולם', 'חתונה', 'בר מצווה', 'שמחה', 'אירוע', 'הזמנה', 'קייטנה'], fileKeywords: ['חתונה', 'אירוע', 'שמחה'] },
  { category: 'electronics', keywords: ['מחשב', 'טלפון', 'סלולר', 'סמארטפון', 'טאבלט', 'מסך', 'אלקטרוניקה'], fileKeywords: ['סלולר', 'מחשב'] },
  { category: 'toys', keywords: ['צעצוע', 'משחק', 'לגו', 'בובה', 'פאזל'], fileKeywords: ['צעצוע', 'משחק'] },
  { category: 'finance', keywords: ['ביטוח', 'פנסיה', 'השקעה', 'הלוואה', 'בנק', 'פיננס', 'חיסכון', 'קרן'], fileKeywords: ['ביטוח', 'פנסיה', 'השקעה'] },
  { category: 'branding', keywords: ['מיתוג', 'לוגו', 'ברנד', 'זהות מותגית'], fileKeywords: ['מיתוג', 'לוגו'] },
];

function categorizeByKeywords(name: string, textContent: string | null): string | null {
  const searchText = ((name || '') + ' ' + (textContent || '')).toLowerCase();
  const fileName = (name || '').toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    // Check file name keywords first (higher confidence)
    if (rule.fileKeywords?.some(kw => fileName.includes(kw.toLowerCase()))) {
      return rule.category;
    }
    // Check text content keywords
    if (rule.keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
      return rule.category;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { batchSize = 100, offset = 0, dryRun = false } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch untagged records
    const { data: records, error: fetchError } = await supabase
      .from('sector_brain_examples')
      .select('id, name, text_content, file_path, media_type')
      .is('topic_category', null)
      .range(offset, offset + batchSize - 1);

    if (fetchError) throw fetchError;
    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ message: 'No more untagged records', categorized: 0, remaining: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { id: string; name: string; category: string }[] = [];
    const uncategorized: { id: string; name: string }[] = [];
    const updates: { id: string; topic_category: string }[] = [];

    for (const record of records) {
      const category = categorizeByKeywords(record.name, record.text_content);
      if (category) {
        results.push({ id: record.id, name: record.name, category });
        updates.push({ id: record.id, topic_category: category });
      } else {
        uncategorized.push({ id: record.id, name: record.name });
      }
    }

    // Apply updates if not dry run
    let appliedCount = 0;
    if (!dryRun && updates.length > 0) {
      // Update in small batches to avoid timeouts
      for (let i = 0; i < updates.length; i += 20) {
        const batch = updates.slice(i, i + 20);
        const promises = batch.map(u =>
          supabase.from('sector_brain_examples').update({ topic_category: u.topic_category }).eq('id', u.id)
        );
        await Promise.all(promises);
        appliedCount += batch.length;
      }
    }

    // Count remaining untagged
    const { count: remaining } = await supabase
      .from('sector_brain_examples')
      .select('id', { count: 'exact', head: true })
      .is('topic_category', null);

    // Summary by category
    const summary: Record<string, number> = {};
    for (const r of results) {
      summary[r.category] = (summary[r.category] || 0) + 1;
    }

    return new Response(JSON.stringify({
      processed: records.length,
      categorized: results.length,
      uncategorized: uncategorized.length,
      applied: dryRun ? 0 : appliedCount,
      remaining: remaining || 0,
      summary,
      dryRun,
      sampleUncategorized: uncategorized.slice(0, 10).map(u => u.name),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('categorize-brain error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
