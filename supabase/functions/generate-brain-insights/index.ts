import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TOPIC_LABELS: Record<string, string> = {
  real_estate: 'נדל"ן', beauty: 'ביוטי', food: 'מזון', cellular: 'סלולר',
  filtered_internet: 'אינטרנט מסונן', electronics: 'מוצרי חשמל',
  hotels: 'מלונאות וחופשות', mens_fashion: 'אופנה גברית',
  womens_fashion: 'אופנת נשים', wigs: 'פאות', makeup: 'איפור וקוסמטיקה',
  education: 'לימודים וחינוך', health: 'בריאות', finance: 'פיננסים וביטוח',
  events: 'אירועים ושמחות', judaica: 'יודאיקה וספרי קודש',
  toys: 'צעצועים ומשחקים', furniture: 'ריהוט ועיצוב הבית',
  jewelry: 'תכשיטים ושעונים', branding: 'מיתוג', other: 'אחר',
};

const MEDIA_TYPE_LABELS: Record<string, string> = {
  ads: 'מודעות', text: 'מלל וקופי', video: 'וידאו',
  signage: 'שילוט', promo: 'קד"מ', radio: 'רדיו',
};

Deno.serve(async (req) => {
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
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch ALL examples with pagination
    let allExamples: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page, error: pageError } = await supabase
        .from('sector_brain_examples')
        .select('id, name, file_type, file_path, text_content, description, topic_category, media_type, stream_type, gender_audience, holiday_season, example_type, is_general_guideline, zone')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (pageError) throw pageError;
      if (page) allExamples = [...allExamples, ...page];
      if (!page || page.length < pageSize) break;
      from += pageSize;
    }

    console.log(`Loaded ${allExamples.length} examples for insight generation`);

    // Build comprehensive statistics
    const stats = {
      total: allExamples.length,
      byTopic: {} as Record<string, number>,
      byMedia: {} as Record<string, number>,
      byStream: {} as Record<string, number>,
      byHoliday: {} as Record<string, number>,
      images: allExamples.filter(e => e.file_type?.startsWith('image/')).length,
      textFiles: allExamples.filter(e => e.text_content).length,
      withDescription: allExamples.filter(e => e.description).length,
      guidelines: allExamples.filter(e => e.is_general_guideline).length,
      good: allExamples.filter(e => e.example_type === 'good').length,
      bad: allExamples.filter(e => e.example_type === 'bad').length,
      untagged: allExamples.filter(e => !e.topic_category).length,
    };

    for (const e of allExamples) {
      if (e.topic_category) stats.byTopic[e.topic_category] = (stats.byTopic[e.topic_category] || 0) + 1;
      if (e.media_type) stats.byMedia[e.media_type] = (stats.byMedia[e.media_type] || 0) + 1;
      if (e.stream_type) stats.byStream[e.stream_type] = (stats.byStream[e.stream_type] || 0) + 1;
      if (e.holiday_season) stats.byHoliday[e.holiday_season] = (stats.byHoliday[e.holiday_season] || 0) + 1;
    }

    // Collect text samples per topic (for richer prompts)
    const textSamplesByTopic: Record<string, string[]> = {};
    for (const e of allExamples) {
      if (e.text_content && e.topic_category) {
        if (!textSamplesByTopic[e.topic_category]) textSamplesByTopic[e.topic_category] = [];
        if (textSamplesByTopic[e.topic_category].length < 5) {
          textSamplesByTopic[e.topic_category].push(e.text_content.substring(0, 300));
        }
      }
    }

    // Collect image descriptions per topic
    const descriptionsByTopic: Record<string, string[]> = {};
    for (const e of allExamples) {
      if (e.description && e.topic_category) {
        if (!descriptionsByTopic[e.topic_category]) descriptionsByTopic[e.topic_category] = [];
        if (descriptionsByTopic[e.topic_category].length < 8) {
          descriptionsByTopic[e.topic_category].push(`"${e.name}": ${e.description}`);
        }
      }
    }

    // General text samples (no topic)
    const generalTextSamples = allExamples
      .filter(e => e.text_content && !e.is_general_guideline)
      .slice(0, 20)
      .map(e => `[${e.name}]: ${e.text_content!.substring(0, 200)}`);

    // General guidelines
    const guidelines = allExamples
      .filter(e => e.is_general_guideline && e.text_content)
      .map(e => e.text_content!.substring(0, 500));

    // Build ONE comprehensive prompt that generates all insights at once
    const systemPrompt = `אתה מומחה בכיר לפרסום ושיווק במגזר החרדי עם 20 שנות ניסיון.
קיבלת גישה מלאה ל-${allExamples.length} חומרי רפרנס שהועלו למערכת — מודעות, קופי, תמונות, תשדירים ואסטרטגיות.

המשימה שלך: לייצר מסמך תובנות מקיף שישמש כ"ספר כללים" לסוכני AI שיוצרים חומרי פרסום למגזר החרדי.

הפורמט המדויק (חובה!):

===INSIGHT:general===
כתוב 6-8 כללי יסוד חוצי-מדיה לפרסום במגזר החרדי. כל כלל בפורמט:
• **כותרת** - הסבר קצר
===END===

===INSIGHT:visual_patterns===
כתוב 5-7 דפוסים ויזואליים שעובדים/לא עובדים. התבסס על תיאורי התמונות שקיבלת. פורמט:
• **דפוס** - הסבר + ✅ עשה / ❌ אל תעשה
===END===

${Object.entries(stats.byTopic).filter(([_, count]) => count >= 3).map(([topic, count]) => {
  const label = TOPIC_LABELS[topic] || topic;
  const texts = textSamplesByTopic[topic] || [];
  const descs = descriptionsByTopic[topic] || [];
  return `===INSIGHT:topic_${topic}===
תובנות לתחום ${label} (${count} דוגמאות):
${descs.length > 0 ? `תיאורי תמונות: ${descs.slice(0, 3).join(' | ')}` : ''}
${texts.length > 0 ? `דוגמאות קופי: ${texts.slice(0, 2).join(' | ')}` : ''}
כתוב 3-4 תובנות ספציפיות לתחום ${label} במגזר. פורמט:
• **תובנה** - הסבר + ✅ עשה / ❌ אל תעשה
===END===`;
}).join('\n\n')}

כללים:
- כתוב בעברית מקצועית ונגישה
- כל סקשן חייב להתחיל ב-===INSIGHT:TYPE=== ולהסתיים ב-===END===
- התמקד בתובנות פרקטיות שסוכן AI יכול ליישם ביצירת מודעה
- אם יש הבדלים בין זרמים (חסידי/ליטאי/ספרדי) — ציין
- הדגש מה עובד ומה לא עובד ספציפית במגזר החרדי`;

    const userPrompt = `📊 סטטיסטיקה מלאה של המאגר:
- סה"כ חומרים: ${stats.total}
- תמונות: ${stats.images} | קבצי טקסט: ${stats.textFiles}
- עם תיאור AI: ${stats.withDescription}
- כללי אצבע: ${stats.guidelines}
- דוגמאות טובות: ${stats.good} | רעות: ${stats.bad}
- ללא תיוג: ${stats.untagged}

📦 פילוח לפי תחום:
${Object.entries(stats.byTopic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${TOPIC_LABELS[k] || k}: ${v}`).join('\n')}

📰 פילוח לפי מדיה:
${Object.entries(stats.byMedia).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${MEDIA_TYPE_LABELS[k] || k}: ${v}`).join('\n')}

🕍 פילוח לפי זרם:
${Object.entries(stats.byStream).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'אין'}

📅 פילוח לפי חג:
${Object.entries(stats.byHoliday).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'אין'}

📝 כללי אצבע קיימים:
${guidelines.slice(0, 10).join('\n') || 'אין'}

📁 דוגמאות קופי (מדגם):
${generalTextSamples.slice(0, 15).join('\n') || 'אין'}

🖼️ תיאורי תמונות מהמאגר (מדגם):
${allExamples.filter(e => e.description).slice(0, 20).map(e => `"${e.name}": ${e.description?.substring(0, 150)}`).join('\n') || 'אין תיאורים'}

🎯 צור מסמך תובנות מקיף בפורמט המדויק שנדרש. כלול סקשנים ל-general, visual_patterns, ולכל תחום עם 3+ דוגמאות.`;

    console.log('Calling AI for comprehensive insight generation...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit - try again later' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const fullContent = aiResult.choices?.[0]?.message?.content || '';
    
    if (!fullContent) {
      throw new Error('Empty AI response');
    }

    console.log(`Got AI response: ${fullContent.length} chars`);

    // Parse sections from the response
    const sectionRegex = /===INSIGHT:(\w+)===\s*([\s\S]*?)===END===/g;
    let match;
    const insights: { type: string; content: string }[] = [];
    
    while ((match = sectionRegex.exec(fullContent)) !== null) {
      const insightType = match[1];
      const content = match[2].trim();
      if (content.length > 30) {
        insights.push({ type: insightType, content });
      }
    }

    // If no sections parsed (AI didn't follow format), save the whole thing as general
    if (insights.length === 0 && fullContent.length > 100) {
      insights.push({ type: 'general', content: fullContent });
    }

    console.log(`Parsed ${insights.length} insight sections`);

    // Save all insights to DB
    let saved = 0;
    for (const insight of insights) {
      // Delete existing insight of same type
      await supabase.from('sector_brain_insights').delete().eq('insight_type', insight.type);
      
      const { error } = await supabase.from('sector_brain_insights').insert({
        insight_type: insight.type,
        content: insight.content,
        created_by: user.id,
        is_active: true,
      });
      
      if (error) {
        console.error(`Failed to save insight ${insight.type}:`, error);
      } else {
        saved++;
      }
    }

    console.log(`Saved ${saved} insights to database`);

    return new Response(JSON.stringify({
      success: true,
      total_examples: allExamples.length,
      insights_generated: insights.length,
      insights_saved: saved,
      types: insights.map(i => i.type),
      stats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
