import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { file_path, record_id } = await req.json();
    
    if (!file_path || !record_id) {
      return new Response(JSON.stringify({ error: 'Missing file_path or record_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Transcribing audio:', file_path, 'record:', record_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Download audio file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('sector-brain')
      .download(file_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download audio file' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Convert to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Audio = base64Encode(new Uint8Array(arrayBuffer));
    
    // Determine MIME type
    const ext = file_path.split('.').pop()?.toLowerCase() || 'mp3';
    const mimeMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'wma': 'audio/x-ms-wma',
    };
    const mimeType = mimeMap[ext] || 'audio/mpeg';

    // Use Lovable AI Gateway with Gemini for transcription
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `תמלל את קובץ האודיו הזה בדיוק. זהו תשדיר רדיו בעברית מהמגזר החרדי.

חשוב:
1. תמלל את כל הטקסט המדובר בדיוק כפי שנאמר
2. ציין בסוגריים מרובעים אירועי אודיו חשובים כגון: [מוזיקה], [ג'ינגל], [אפקט קולי], [שינוי קריין]
3. אם יש מספר דוברים, ציין [דובר 1], [דובר 2] וכו'
4. בסוף, הוסף שורה ריקה ואז סיכום קצר: סגנון הקריינות (מכירתי/אינפורמטיבי/רגשי), קצב (מהיר/בינוני/איטי), ומבנה התשדיר

תן רק את התמליל, ללא הסברים נוספים.`
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Audio,
                  format: ext === 'wav' ? 'wav' : 'mp3',
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI transcription error:', aiResponse.status, errText);
      return new Response(JSON.stringify({ error: 'Transcription failed', details: errText }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiResponse.json();
    const transcription = aiData.choices?.[0]?.message?.content || '';

    if (!transcription) {
      return new Response(JSON.stringify({ error: 'Empty transcription result' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Transcription length:', transcription.length);

    // Save transcription to the sector_brain_examples record
    const { error: updateError } = await supabase
      .from('sector_brain_examples')
      .update({ text_content: transcription })
      .eq('id', record_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save transcription' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      transcription,
      length: transcription.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
