import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchAgentPrompt(agentKey: string, fallback: string): Promise<string> {
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await supabaseAdmin.from('agent_prompts').select('system_prompt').eq('agent_key', agentKey).maybeSingle();
    if (data?.system_prompt) {
      console.log(`[${agentKey}] Loaded dynamic prompt from DB (${data.system_prompt.length} chars)`);
      return data.system_prompt;
    }
    console.log(`[${agentKey}] No DB prompt found, using fallback`);
    return fallback;
  } catch (e) {
    console.error(`[${agentKey}] Failed to fetch prompt:`, e);
    return fallback;
  }
}

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
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI service configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { imageUrl } = await req.json();
    
    console.log("Starting kosher check for image");

    // Fetch red lines examples from database
    const { data: redLines, error: redLinesError } = await supabase
      .from('sector_brain_examples')
      .select('*')
      .eq('zone', 'redlines');

    if (redLinesError) {
      console.error("Error fetching red lines:", redLinesError);
    }

    // Fetch hall of fame examples
    const { data: fameExamples, error: fameError } = await supabase
      .from('sector_brain_examples')
      .select('*')
      .eq('zone', 'fame');

    if (fameError) {
      console.error("Error fetching fame examples:", fameError);
    }

    const redLinesCount = redLines?.length || 0;
    const fameCount = fameExamples?.length || 0;

    let contextInfo = '';
    if (redLinesCount > 0) {
      contextInfo += `\n\nהמערכת למדה ${redLinesCount} דוגמאות של תוכן אסור ("קווים אדומים").`;
    }
    if (fameCount > 0) {
      contextInfo += `\n\nהמערכת למדה ${fameCount} דוגמאות של קמפיינים מוצלחים.`;
    }

    const analysisPrompt = `You are a "Digital Mashgiach" (kosher supervisor) for Haredi (Ultra-Orthodox Jewish) advertising content.

Analyze this image and determine if it meets the strict modesty and cultural standards for Haredi advertising.
${contextInfo}

Check for these issues:
1. **Modesty (צניעות)**: No inappropriate imagery, women must be dressed modestly (long sleeves, high necklines, covered legs), no immodest poses
2. **Family Values**: Content should be family-friendly, no violence, no inappropriate themes
3. **Cultural Sensitivity**: No symbols or imagery that conflicts with Orthodox Jewish values
4. **Text Quality**: If Hebrew text is present, check it's spelled correctly and appropriate
5. **Professional Standards**: Image should be suitable for religious newspapers and publications

Respond in JSON format:
{
  "status": "approved" | "needs-review" | "rejected",
  "confidence": 0-100,
  "issues": ["list of specific issues found, if any"],
  "recommendation": "Brief Hebrew explanation for the user"
}

If no issues are found, mark as "approved".
If minor/unclear issues, mark as "needs-review".
If clear violations, mark as "rejected".`;

    console.log("Sending image for analysis");

    let content = '';
    let aiSuccess = false;

    // Attempt 1: Direct Google Gemini API (supports vision with URL in prompt)
    if (GOOGLE_GEMINI_API_KEY) {
      console.log('Trying direct Google Gemini API for kosher check...');
      try {
        const directResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: `${analysisPrompt}\n\nImage URL to analyze: ${imageUrl}` },
                ]
              }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
            }),
          }
        );

        if (directResponse.ok) {
          const data = await directResponse.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) {
            aiSuccess = true;
            console.log('Google Gemini direct success for kosher check');
          }
        } else {
          const errorText = await directResponse.text();
          console.error('Google Gemini direct error:', directResponse.status, errorText);
        }
      } catch (err) {
        console.error('Google Gemini direct fetch error:', err);
      }
    }

    // Attempt 2: Lovable AI Gateway fallback
    if (!aiSuccess && LOVABLE_API_KEY) {
      console.log('Falling back to Lovable AI Gateway for kosher check...');
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: analysisPrompt },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI analysis error:", response.status, errorText);
        
        return new Response(JSON.stringify({
          status: 'needs-review',
          confidence: 0,
          issues: ['לא ניתן לבצע בדיקה אוטומטית'],
          recommendation: 'נדרשת בדיקה אנושית'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      return new Response(JSON.stringify({
        status: 'needs-review',
        confidence: 0,
        issues: ['לא התקבלה תשובה מהמודל'],
        recommendation: 'נדרשת בדיקה אנושית'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Analysis response:", content);

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error("Failed to parse analysis:", parseError);
      analysis = {
        status: 'needs-review',
        confidence: 50,
        issues: ['לא ניתן לפרסר את תוצאת הבדיקה'],
        recommendation: 'נדרשת בדיקה אנושית'
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in kosher-check function:", error);
    return new Response(JSON.stringify({
      status: 'needs-review',
      confidence: 0,
      issues: [error instanceof Error ? error.message : 'שגיאה לא צפויה'],
      recommendation: 'נדרשת בדיקה אנושית'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
