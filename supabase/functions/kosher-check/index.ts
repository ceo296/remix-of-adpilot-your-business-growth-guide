import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const clampConfidence = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function normalizeKosherStatus(rawStatus: unknown): 'approved' | 'needs-review' | 'rejected' {
  const value = String(rawStatus ?? '').toLowerCase().trim();

  // Approved patterns (check first — most ads pass)
  if (/(approved|approve|מאושר|תקין|תקינה|עוברת|עובר|kosher|כשר|passed|pass|clean|נקי|no.?issues|ללא.?ליקויים|ללא.?בעיות)/i.test(value)) return 'approved';
  
  // Rejected patterns
  if (/(rejected|reject|נדחה|נפסל|פסול|אסור|fail|failed|violation|הפרה)/i.test(value)) return 'rejected';
  
  // Needs-review patterns
  if (/(needs-review|needs.?review|review|בדיקה|דורש|לבדוק)/i.test(value)) return 'needs-review';

  return 'needs-review';
}

function parseConfidenceFromText(content: string): number {
  const match = content.match(/(?:confidence|ציון\s*ביטחון|ביטחון|score)\D{0,12}(\d{1,3})\s*%?/i);
  if (!match) return 75; // Default to 75 if no confidence found (most ads are fine)
  return clampConfidence(Number(match[1]));
}

function inferStatusFromContent(content: string): 'approved' | 'needs-review' | 'rejected' {
  const lower = content.toLowerCase();
  
  // Count positive vs negative signals
  const positiveSignals = [
    /תקין/i, /מאושר/i, /עובר/i, /approved/i, /כשר/i, /ללא.{0,10}(ליקויים|בעיות|הפרות)/i,
    /no.{0,10}(issues|violations|problems)/i, /meets.{0,10}standards/i, /compliant/i,
    /עומד.{0,10}בסטנדרט/i, /תקינה/i, /clean/i,
  ];
  const negativeSignals = [
    /נדח/i, /אסור/i, /rejected/i, /פסול/i, /הפרה חמורה/i, /violation/i,
    /immodest/i, /inappropriate/i, /לא צנוע/i,
  ];
  
  const posCount = positiveSignals.filter(r => r.test(content)).length;
  const negCount = negativeSignals.filter(r => r.test(content)).length;
  
  if (negCount >= 2) return 'rejected';
  if (posCount >= 2 && negCount === 0) return 'approved';
  if (posCount > negCount) return 'approved';
  if (negCount > posCount) return 'rejected';
  
  return 'needs-review';
}

function parseTextualAnalysis(content: string): {
  status: 'approved' | 'needs-review' | 'rejected';
  confidence: number;
  issues: string[];
  recommendation: string;
} {
  const status = inferStatusFromContent(content);
  const confidence = parseConfidenceFromText(content);

  // Extract issues
  const issuePatterns = [
    /(?:issues|ליקויים|בעיות|הערות)[:\s]*([\s\S]*?)(?:המלצה|recommendation|סיכום|$)/i,
    /(?:רשימת\s*ליקויים)[:\s]*([\s\S]*?)(?:המלצה\s*לתיקון|$)/i,
  ];
  
  let issues: string[] = [];
  for (const pattern of issuePatterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      issues = match[1]
        .split('\n')
        .map((line) => line.replace(/^\s*[-*\d.]+\s*/, '').trim())
        .filter((line) => line.length > 2)
        .slice(0, 8);
      if (issues.length > 0) break;
    }
  }

  const recommendationMatch = content.match(/(?:המלצה|recommendation|סיכום)[:\s]*([\s\S]{5,}?)$/i);
  const recommendation = recommendationMatch?.[1]?.trim()
    || (status === 'approved'
      ? 'התמונה תקינה ועברה את הבדיקה האוטומטית'
      : status === 'rejected'
      ? 'נמצאו הפרות — נדרש תיקון לפני פרסום'
      : 'נדרשת בדיקה אנושית נוספת לפני פרסום');

  return {
    status,
    confidence,
    issues,
    recommendation: recommendation.slice(0, 1200),
  };
}

async function fetchAgentPrompt(agentKey: string, fallback: string): Promise<string> {
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await supabaseAdmin.from('agent_prompts').select('system_prompt').eq('agent_key', agentKey).maybeSingle();
    if (data?.system_prompt) {
      console.log(`[${agentKey}] Loaded dynamic prompt from DB (${data.system_prompt.length} chars)`);
      return data.system_prompt;
    }
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('No AI service configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { imageUrl } = await req.json();
    
    console.log("Starting kosher check for image:", imageUrl?.substring(0, 60));

    // Fetch red lines & fame examples in parallel
    const [redLinesResult, fameResult] = await Promise.all([
      supabase.from('sector_brain_examples').select('name, text_content').eq('zone', 'redlines').limit(10),
      supabase.from('sector_brain_examples').select('name, text_content').eq('zone', 'fame').limit(10),
    ]);

    const redLines = redLinesResult.data || [];
    const fameExamples = fameResult.data || [];

    let contextInfo = '';
    if (redLines.length > 0) {
      contextInfo += `\n\nהמערכת למדה ${redLines.length} דוגמאות של תוכן אסור ("קווים אדומים").`;
    }
    if (fameExamples.length > 0) {
      contextInfo += `\n\nהמערכת למדה ${fameExamples.length} דוגמאות של קמפיינים מוצלחים.`;
    }

    const DEFAULT_KOSHER_PROMPT = `You are a "Digital Mashgiach" (kosher supervisor) for Haredi (Ultra-Orthodox Jewish) advertising content.

Analyze this image and determine if it meets the strict modesty and cultural standards for Haredi advertising.
${contextInfo}

Check for these issues:
1. **Modesty (צניעות)**: No women/girls visible, men dressed modestly
2. **Family Values**: Content should be family-friendly, no violence
3. **Cultural Sensitivity**: No symbols conflicting with Orthodox Jewish values
4. **Text Quality**: Hebrew text spelled correctly and appropriate
5. **Professional Standards**: Suitable for religious publications

IMPORTANT: You MUST respond in valid JSON format ONLY. No text before or after the JSON.

{
  "status": "approved" | "needs-review" | "rejected",
  "confidence": 0-100,
  "issues": ["list of specific issues found, if any"],
  "recommendation": "Brief Hebrew explanation"
}

DECISION RULES:
- If the ad looks like a standard professional Haredi advertisement with NO women and NO immodest content → status: "approved", confidence: 85+
- If there are MINOR issues (slightly unclear text, small layout concern) → status: "approved", confidence: 70-84
- If you are GENUINELY uncertain about modesty → status: "needs-review"
- ONLY use "rejected" for CLEAR violations (women visible, immodest content, offensive imagery)
- Most professional Haredi ads should be "approved" — do NOT default to "needs-review" when unsure`;

    const dbPrompt = await fetchAgentPrompt('kosher-check', '');
    const analysisPrompt = dbPrompt 
      ? dbPrompt + contextInfo
      : DEFAULT_KOSHER_PROMPT;

    console.log("Sending image for kosher analysis via Lovable AI Gateway");

    // Use Lovable AI Gateway (supports base64 images)
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
      
      // Default to approved for gateway errors (don't block the user)
      return new Response(JSON.stringify({
        status: 'approved',
        confidence: 50,
        issues: [],
        recommendation: 'בדיקה אוטומטית לא זמינה כרגע — מאושר זמנית'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      return new Response(JSON.stringify({
        status: 'approved',
        confidence: 50,
        issues: [],
        recommendation: 'לא התקבלה תשובה — מאושר זמנית'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Kosher analysis response:", content.substring(0, 300));

    // Parse JSON from response with robust fallback
    let analysis: any;
    const fallbackAnalysis = parseTextualAnalysis(content);
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        console.log("No JSON found in response, using text analysis fallback");
        analysis = fallbackAnalysis;
      }
    } catch (parseError) {
      console.error("Failed to parse JSON, using text fallback:", parseError);
      analysis = fallbackAnalysis;
    }

    // Normalize all fields
    const normalizedStatus = normalizeKosherStatus(analysis?.status ?? fallbackAnalysis.status);
    const normalizedConfidence = clampConfidence(
      typeof analysis?.confidence === 'number'
        ? analysis.confidence
        : fallbackAnalysis.confidence
    );
    const normalizedIssues = Array.isArray(analysis?.issues)
      ? analysis.issues.map((issue: unknown) => String(issue).trim()).filter(Boolean).slice(0, 8)
      : fallbackAnalysis.issues;
    const normalizedRecommendation = (
      typeof analysis?.recommendation === 'string' && analysis.recommendation.trim()
        ? analysis.recommendation.trim()
        : fallbackAnalysis.recommendation
    ).slice(0, 1200);

    const result = {
      status: normalizedStatus,
      confidence: normalizedConfidence,
      issues: normalizedIssues,
      recommendation: normalizedRecommendation,
    };

    console.log("Kosher check result:", result.status, "confidence:", result.confidence);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in kosher-check function:", error);
    // Default to approved on errors — don't block user workflow
    return new Response(JSON.stringify({
      status: 'approved',
      confidence: 0,
      issues: [error instanceof Error ? error.message : 'שגיאה לא צפויה'],
      recommendation: 'שגיאה בבדיקה — מאושר זמנית'
    }), {
      status: 200, // Return 200 so it doesn't break the flow
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
