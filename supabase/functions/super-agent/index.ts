import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchSectorBrainFromDB(holidaySeason?: string | null, topicCategory?: string | null) {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const selectFields = 'name, zone, description, text_content, stream_type, gender_audience, topic_category, holiday_season, media_type, example_type, file_path, file_type, is_general_guideline';
    
    // 1. Topic-specific examples (highest priority)
    let topicExamples: any[] = [];
    if (topicCategory) {
      const { data } = await supabase.from('sector_brain_examples').select(selectFields).eq('topic_category', topicCategory).eq('is_general_guideline', false).limit(30);
      topicExamples = data || [];
    }
    // 2. Holiday-specific examples
    let holidayExamples: any[] = [];
    if (holidaySeason && holidaySeason !== 'year_round') {
      const { data } = await supabase.from('sector_brain_examples').select(selectFields).eq('holiday_season', holidaySeason).eq('is_general_guideline', false).limit(30);
      holidayExamples = data || [];
    }
    // 3. General examples (fill remaining quota)
    const remainingQuota = Math.max(10, 50 - topicExamples.length - holidayExamples.length);
    const generalQuery = supabase.from('sector_brain_examples').select(selectFields).eq('is_general_guideline', false).limit(remainingQuota);
    if (topicCategory) generalQuery.or(`topic_category.is.null,topic_category.neq.${topicCategory}`);
    if (holidaySeason && holidaySeason !== 'year_round') generalQuery.or(`holiday_season.is.null,holiday_season.eq.year_round`);
    const { data: generalData, error } = await generalQuery;
    if (error) return null;

    // 4. Fetch Guidelines (כללי אצבע)
    const { data: guidelinesData } = await supabase.from('sector_brain_examples').select('text_content').eq('is_general_guideline', true).limit(20);
    const guidelines = (guidelinesData || []).map(g => g.text_content).filter(Boolean);

    // 5. Fetch saved AI Insights
    let insightsFilter = supabase.from('sector_brain_insights').select('insight_type, content').eq('is_active', true).order('updated_at', { ascending: false }).limit(10);
    if (topicCategory) {
      insightsFilter = supabase.from('sector_brain_insights').select('insight_type, content').eq('is_active', true).or(`insight_type.eq.general,insight_type.eq.visual_patterns,insight_type.eq.creative_correction,insight_type.eq.topic_${topicCategory}`).order('updated_at', { ascending: false }).limit(10);
    }
    const { data: insightsData } = await insightsFilter;
    const insights = (insightsData || []).map(i => `[${i.insight_type}]: ${i.content?.substring(0, 2000)}`);

    // Deduplicate examples
    const seen = new Set<string>();
    const allExamples: any[] = [];
    for (const item of [...topicExamples, ...holidayExamples, ...(generalData || [])]) {
      if (!seen.has(item.name)) { seen.add(item.name); allExamples.push(item); }
    }
    if (!allExamples.length && !guidelines.length && !insights.length) return null;
    const grouped: Record<string, typeof allExamples> = {};
    for (const item of allExamples) { const zone = item.zone || 'general'; if (!grouped[zone]) grouped[zone] = []; grouped[zone].push(item); }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Build full image URLs for ALL image examples
    const imageExamples = allExamples
      .filter(e => e.file_path && e.file_type && /image|png|jpg|jpeg|webp/i.test(e.file_type))
      .map(e => ({
        url: `${supabaseUrl}/storage/v1/object/public/sector-brain/${e.file_path}`,
        name: e.name,
        zone: e.zone,
        description: e.description || '',
        text_content: e.text_content || '',
        stream_type: e.stream_type || '',
        topic_category: e.topic_category || '',
        media_type: e.media_type || '',
        example_type: e.example_type || '',
      }));

    // Build detailed text descriptions of ALL examples
    const detailedExamples = allExamples.map(e => {
      const parts = [`📌 "${e.name}"`];
      if (e.zone) parts.push(`אזור: ${e.zone}`);
      if (e.example_type) parts.push(`סוג: ${e.example_type}`);
      if (e.stream_type) parts.push(`זרם: ${e.stream_type}`);
      if (e.gender_audience) parts.push(`קהל: ${e.gender_audience}`);
      if (e.topic_category) parts.push(`נושא: ${e.topic_category}`);
      if (e.holiday_season) parts.push(`עונה: ${e.holiday_season}`);
      if (e.media_type) parts.push(`מדיה: ${e.media_type}`);
      if (e.description) parts.push(`תיאור: ${e.description}`);
      if (e.text_content) parts.push(`תוכן: ${e.text_content.substring(0, 500)}`);
      return parts.join(' | ');
    });

    return {
      total_examples: allExamples.length,
      topic_specific_count: topicExamples.length,
      topic: topicCategory || null,
      holiday_specific_count: holidayExamples.length,
      holiday: holidaySeason || null,
      zones: grouped,
      imageExamples, // full structured image data
      guidelines,
      insights,
      detailedExamples, // full text details
      summary: Object.entries(grouped).map(([z, items]) => `${z}: ${items.length} דוגמאות`).join(', '),
    };
  } catch { return null; }
}

const SYSTEM_PROMPT = `זהות ותפקיד:
אתה סוכן AI בכיר המשמש כ־ איש פרסום חרדי וותיק עם ניסיון של מעל 10 שנים.
אתה משמש כ- המבוגר האחראי של מערכת הפרסום החרדית, סדרן תנועה בין סוכנים, כלים ומודלים, וכשומר הסף שמוודא שהמערכת לעולם לא תוציא תחת ידה משהו שלא מתאים למגזר החרדי או נראה לא טוב.

אתה משלב בו־זמנית את התפקידים הבאים:
- מנהל קריאייטיב חרדי
- אסטרטג פרסום
- תקציבאי
- סוכן הסטודיו
- איש שיווק חרדי בקיא ומנוסה
- סמכות ערכית־מגזרית

=== כללי ברזל לאסטרטגיה קריאטיבית ===
1. כשאתה מנחה את סוכן הקריאייטיב — דרוש ממנו כותרות שנוניות עם משחקי מילים, טוויסטים, מטאפורות חכמות
2. הקריאייטיב צריך להיות חזק באופן כללי — לא תלוי בעולם מסוים. דוגמאות:
   - נדל"ן: "חלון שמתגשם" (טוויסט על "חלום"), שיניים: "הפה שלך. הבמה שלנו." (מטאפורה), מזון: "טעם שלא שוכחים. גם כשהצלחת ריקה." (ניגוד)
3. ניואנסים מעולם התורה/גמרא/חז"ל הם אפשרות אחת מתוך כמה — לא ברירת מחדל. רק כשזה מתחבר טבעי ומוסיף טוויסט אמיתי.
4. כשהקמפיין קשור לחג — הנח את סוכן הקריאייטיב לשלב ניואנסים מגזריים ספציפיים:
   - פסח: "מה נשתנה" כטוויסט, "לצאת מהמצרים/מיצרים", "דיינו", "עבדים היינו ל...", קמחא דפסחא, מצה שמורה, ליל הסדר
   - סוכות: "ושמחת בחגך", אושפיזין, "חג האסיף", שמחת בית השואבה
   - חנוכה: "מוסיף והולך", "נס גדול היה פה", "מעט מן האור"
   - פורים: "נהפוך הוא", "ליהודים היתה אורה", משלוח מנות
   - ימים נוראים: "המלך בשדה", תשובה/תפילה/צדקה, שופר, תפוח בדבש
   - בין הזמנים: לא "חופש" אלא "בין הזמנים", נופש משפחתי
5. למד מהרפרנסים של Sector Brain ודרוש מהסוכנים להתאים את הרמה
6. איסור מוחלט על קלישאות: "הכי טוב", "מקצועי ואיכותי", "שירות מעולה" — אלה מילות סרק
===

=== הוראות למידת רפרנסים ===
כשאתה מקבל תמונות רפרנס מה-Sector Brain, אתה חייב:
1. לנתח כל תמונה בפירוט: קומפוזיציה, צבעים, טיפוגרפיה, סגנון, אווירה, מסר
2. לזהות דפוסים חוזרים בין הרפרנסים — מה משותף למודעות המצליחות?
3. לזהות "חוקים לא כתובים" של המגזר — מה תמיד מופיע? מה לעולם לא?
4. להפיק תובנות פרקטיות שניתן להעביר לסוכני הקריאייטיב והסטודיו
5. לציין דוגמאות ספציפיות בשם כשאתה מתייחס אליהן
===

=== גארדריילס: התאמה לקהל חרדי ===
הקריאייטיב חייב תמיד להתאים לקהל חרדי. חופש יצירתי מלא — בתנאי שלא פוגע:
- אסור לשון מעוררת (דאבל-אנטנדר מיני, רמזים בוטים)
- אסור הומור שמלגלג על דת, רבנים, מנהגים, או קהילות
- אסור שפה אגרסיבית, צעקנית, או מתריסה כלפי המסורת
- אסור התייחסות לנושאים רגישים (פוליטיקה, מחלוקות בין זרמים, ענייני צניעות)
- מותר הומור חם, חכם, ונעים. מותר שנינות. מותר להפתיע. אסור לפגוע.
===

=== כלל קריטי: התאמת ויזואל למוצר/שירות בפועל ===
הויזואל חייב להתאים במדויק למוצר או לשירות שמפורסם. אסור "החלקה" בין תחומים קרובים:
- טיפול פנים ≠ שיניים. קוסמטיקה = פנים, עור, קרמים. לא כלים דנטליים.
- רופא עיניים ≠ רופא שיניים ≠ רופא כללי. כל אחד עם הכלים והסמלים שלו בלבד.
- מסעדה ≠ קייטרינג ≠ סופרמרקט. אוכל מוגמר ≠ מדפים ≠ שירות אירועים.
- נדל"ן מגורים ≠ נדל"ן מסחרי ≠ שיפוצים. בניין ≠ משרד ≠ פטיש.
כלל: "האם לקוח שרואה את התמונה מבין מיד מה השירות?" אם לא — תחליף.
===

גבולות אדומים (איסורים מוחלטים):
- אסור לנבל את הפה
- אין שפה רחובית: אין ביטויים צבאיים, סלנג חילוני בוטה
- אסור לומר את שם השם המפורש
- אסור לדבר סרה ברבנים או עולם התורה
- אין להציג נשים או נערות (חריגים בדיגיטל ינוהלו ע"י סוכן סטודיו)
- גברים וילדים תמיד בלבוש צנוע תואם למגזר
- אין לאשר תוכן אנטי חרדי
- אין להציג מכשירים טכנולוגיים לא מסוננים, לבוש לא צנוע, או תרבות פנאי קלוקלת

שפה וטון: קליל, נעים, אנושי, חרדי אותנטי, סמכותי בלי התנשאות.

זרמים:
- ליטאי: רציונלי, אינטלקטואלי, שפה גבוהה. חליפות קצרות, כובעים קנייטש.
- חסידי: רגשי, נאמן לחצרות, יוקרה ומסורת. פאות, חליפות ארוכות, שטריימל.
- ספרדי: חם, משפחתי, מסורת ואמונת חכמים.
- חרדי מודרני: עובד, צורך אינטרנט, מעריך איכות חיים וחדשנות.

מעגל השנה:
- אלול וחגי תשרי: חיזוק, התחדשות, משפחתיות
- אדר: שמחה, משלוחי מנות
- ניסן (פסח): שיא מכירות, התחדשות
- בין הזמנים: נופש, תיירות
- חורף: רישום למוסדות חינוך

פרוטוקול פלט טכני:
בסיום כל הודעה, צרף בלוק JSON בפורמט SYSTEM_COMMAND הכולל:
- current_phase
- next_agent: Creative/Studio/Media/User
- action_type: Approve/Reject/Route
- payload: { target_audience, strategy, creative_direction, visual_guidelines, usp, brief_summary }

ניתוב מסלולי שירות:
- Full Service: אסטרטגיה -> קריאייטיב -> סטודיו -> מדיה
- Production Only: סטודיו -> מדיה
- Media Only: מדיה (בכפוף לאישור ועדת רוחנית)
- Creative Only: אסטרטגיה -> קריאייטיב -> סיום`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { message, clientProfile, campaignContext, sectorBrainData: clientSectorData, conversationHistory, topicCategory: reqTopic } = await req.json();
    const detectedHoliday = campaignContext?.timing || campaignContext?.holiday_season || null;
    const detectedTopic = reqTopic || campaignContext?.topic_category || null;
    const sectorBrainData = clientSectorData || await fetchSectorBrainFromDB(detectedHoliday, detectedTopic);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Campaign goal → style directives
    const GOAL_STYLE_MAP: Record<string, string> = {
      'awareness': '🎯 מטרה: מודעות למותג — הטון צריך להיות אלגנטי, מרשים ומעורר השראה. הוויזואל צריך להיות premium ו-aspirational. אל תלחץ על מכירה, תלחץ על תחושה. כותרות קצרות וחזקות שמעבירות מסר מותגי.',
      'promotion': '🔥 מטרה: סייל/מבצע — הטון צריך להיות דחוף, ישיר ואקטיבי. המחיר/ההנחה חייבים להיות בולטים. CTA חזק ובהיר. צבעים חמים ובולטים. תחושת "עכשיו או לעולם לא". כותרות שמדגישות את ההצעה.',
      'launch': '🚀 מטרה: השקה — הטון צריך להיות דרמטי, מפתיע ומלהיב. ויזואל שובר מוסכמות עם אלמנט של חידוש. תחושת "משהו חדש ומרגש מגיע". כותרות שמעוררות סקרנות ותשומת לב.',
      'seasonal': '🎉 מטרה: עונתי/חג — הטון צריך להיות חגיגי, חם ומשפחתי. שילוב אלמנטים עונתיים רלוונטיים. תחושת שמחה ושייכות. ויזואל שמשדר אווירת חג ומסורת.',
    };
    const goalDirective = campaignContext?.goal ? GOAL_STYLE_MAP[campaignContext.goal] || '' : '';

    // Build context parts for text
    const contextParts = [];
    if (goalDirective) contextParts.push(`\n=== הנחיית סגנון לפי מטרת הקמפיין ===\n${goalDirective}`);
    if (clientProfile) {
      // Strip large base64 logo from profile to avoid payload bloat
      const lightProfile = { ...clientProfile };
      if (lightProfile.logo_url && String(lightProfile.logo_url).length > 5000) {
        lightProfile.logo_url = '[logo_uploaded]';
      }
      contextParts.push(`פרופיל לקוח: ${JSON.stringify(lightProfile)}`);
      // Inject layout instructions from past materials analysis
      if (lightProfile.layoutInstructions) {
        contextParts.push(`\n${lightProfile.layoutInstructions}`);
      }
    }
    if (campaignContext) contextParts.push(`הקשר קמפיין: ${JSON.stringify(campaignContext)}`);
    
    // === KEY FIX: Include FULL detailed examples, not just summary ===
    if (sectorBrainData) {
      contextParts.push(`\n=== מאגר רפרנסים: ${sectorBrainData.total_examples} דוגמאות (${sectorBrainData.topic_specific_count} לנושא, ${sectorBrainData.holiday_specific_count} לחג) ===`);
      
      // Include full detailed text for each example
      if (sectorBrainData.detailedExamples?.length) {
        contextParts.push(`\n=== פירוט דוגמאות הרפרנס — קרא כל אחת בקפידה! ===\n${sectorBrainData.detailedExamples.join('\n')}`);
      }
    }
    
    if (sectorBrainData?.guidelines?.length) {
      contextParts.push(`\n=== כללי אצבע (Guidelines) — חובה לפעול לפיהם! ===\n${sectorBrainData.guidelines.map((g: string, i: number) => `${i+1}. ${g}`).join('\n')}`);
    }
    if (sectorBrainData?.insights?.length) {
      contextParts.push(`\n=== תובנות AI שנלמדו מניתוח המאגר ===\n${sectorBrainData.insights.join('\n\n')}`);
    }
    
    const systemContent = SYSTEM_PROMPT + (contextParts.length ? '\n\n=== הקשר ===\n' + contextParts.join('\n') : '');

    // Build conversation messages
    const textMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemContent },
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ];

    // === Fetch reference images and send them as multimodal parts to Gemini ===
    const imageUrls = sectorBrainData?.imageExamples?.slice(0, 15) || [];
    
    let content = '';
    let aiSuccess = false;

    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log(`Trying Google Gemini API with ${imageUrls.length} reference images...`);
        
        // Fetch images in parallel (up to 15), with timeout
        const imageParts: any[] = [];
        if (imageUrls.length > 0) {
          const fetchPromises = imageUrls.map(async (img: any) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              const resp = await fetch(img.url, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (!resp.ok) return null;
              const arrayBuf = await resp.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
              const mimeType = resp.headers.get('content-type') || 'image/jpeg';
              return {
                inlineData: { mimeType, data: base64 },
                name: img.name,
              };
            } catch {
              return null;
            }
          });
          
          const results = await Promise.allSettled(fetchPromises);
          for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
              imageParts.push(result.value);
            }
          }
          console.log(`Successfully fetched ${imageParts.length}/${imageUrls.length} images`);
        }
        
        // Build Gemini multimodal request
        const geminiSystemText = textMessages.find(m => m.role === 'system')?.content || '';
        const geminiMessages = textMessages.filter(m => m.role !== 'system');
        
        // Build the user message parts with images
        const contents: any[] = [];
        for (const msg of geminiMessages) {
          if (msg.role === 'user' && msg === geminiMessages[geminiMessages.length - 1] && imageParts.length > 0) {
            // Last user message - attach images
            const parts: any[] = [];
            
            // Add image reference context
            const imageNames = imageUrls.slice(0, imageParts.length).map((img: any) => img.name);
            parts.push({ text: `להלן ${imageParts.length} תמונות רפרנס מהמאגר המגזרי (${imageNames.join(', ')}). נתח אותן בקפידה:\n\n` });
            
            // Add images
            for (const imgPart of imageParts) {
              parts.push({ inlineData: imgPart.inlineData });
            }
            
            // Add the actual user message
            parts.push({ text: `\n\n${msg.content}` });
            
            contents.push({ role: 'user', parts });
          } else {
            contents.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            });
          }
        }
        
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: geminiSystemText }] },
              contents,
              generationConfig: { maxOutputTokens: 8192 },
            }),
          }
        );
        if (directResponse.ok) {
          const data = await directResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) aiSuccess = true;
        } else {
          const errText = await directResponse.text();
          console.error('Google API error:', directResponse.status, errText);
        }
      } catch (e) {
        console.error('Google API fetch error:', e);
      }
    }

    // Fallback to Lovable Gateway (text-only, but with full details)
    if (!aiSuccess && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable Gateway (text-only)...');
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: textMessages, max_completion_tokens: 8192 }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        const status = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500;
        return new Response(JSON.stringify({ error: status === 429 ? 'Rate limit exceeded' : status === 402 ? 'AI credits exhausted' : 'AI processing failed' }), {
          status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiData = await aiResponse.json();
      content = aiData.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to extract SYSTEM_COMMAND JSON from response
    let systemCommand = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        systemCommand = JSON.parse(jsonMatch[1]);
      } catch { /* ignore parse errors */ }
    }

    return new Response(JSON.stringify({
      success: true,
      response: content,
      systemCommand,
      agent: 'super-agent',
      referencesAnalyzed: imageUrls.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Super Agent error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
