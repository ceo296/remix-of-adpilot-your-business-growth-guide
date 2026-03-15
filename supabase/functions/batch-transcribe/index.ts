import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: accept service role key or valid user session
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (authHeader === `Bearer ${serviceRoleKey}`) {
    // Service role access - OK
  } else if (authHeader?.startsWith('Bearer ')) {
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find all radio scripts without transcription
    const { data: records, error: fetchError } = await supabase
      .from('sector_brain_examples')
      .select('id, name, file_path, file_type')
      .eq('media_type', 'radio_script')
      .eq('is_general_guideline', false)
      .or('text_content.is.null,text_content.eq.')
      .order('created_at');

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filter to only audio files (not .docx)
    const audioRecords = (records || []).filter(r => 
      /\.(mp3|wav|m4a|ogg|aac|flac|mp4|mpeg)$/i.test(r.file_path)
    );

    console.log(`Found ${audioRecords.length} audio files to transcribe`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    
    if (!LOVABLE_API_KEY && !GOOGLE_GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'No AI key configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: { id: string; name: string; status: string; error?: string }[] = [];

    for (const record of audioRecords) {
      try {
        console.log(`Transcribing: ${record.name} (${record.file_path})`);

        // Download audio
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('sector-brain')
          .download(record.file_path);

        if (downloadError || !fileData) {
          results.push({ id: record.id, name: record.name, status: 'error', error: 'download failed' });
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64Audio = base64Encode(new Uint8Array(arrayBuffer));

        const ext = record.file_path.split('.').pop()?.toLowerCase() || 'mp3';
        const mimeMap: Record<string, string> = {
          'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/mp4',
          'ogg': 'audio/ogg', 'aac': 'audio/aac', 'mp4': 'audio/mp4', 'mpeg': 'audio/mpeg',
        };
        const mimeType = mimeMap[ext] || 'audio/mpeg';

        const transcriptionPrompt = `תמלל את קובץ האודיו הזה בדיוק. זהו תשדיר רדיו בעברית מהמגזר החרדי.

חשוב:
1. תמלל את כל הטקסט המדובר בדיוק כפי שנאמר
2. ציין בסוגריים מרובעים אירועי אודיו חשובים כגון: [מוזיקה], [ג'ינגל], [אפקט קולי], [שינוי קריין]
3. אם יש מספר דוברים, ציין [דובר 1], [דובר 2] וכו'
4. בסוף, הוסף שורה ריקה ואז סיכום קצר: סגנון הקריינות (מכירתי/אינפורמטיבי/רגשי), קצב (מהיר/בינוני/איטי), ומבנה התשדיר

תן רק את התמליל, ללא הסברים נוספים.`;

        let transcription = '';

        // Try Gemini direct first (better audio support)
        if (GOOGLE_GEMINI_API_KEY) {
          try {
            const geminiResp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: transcriptionPrompt },
                      { inline_data: { mime_type: mimeType, data: base64Audio } }
                    ]
                  }]
                }),
              }
            );

            if (geminiResp.ok) {
              const geminiData = await geminiResp.json();
              transcription = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
          } catch (e) {
            console.error('Gemini direct failed, trying gateway:', e);
          }
        }

        // Fallback to Lovable AI Gateway
        if (!transcription && LOVABLE_API_KEY) {
          const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: transcriptionPrompt },
                  { type: 'input_audio', input_audio: { data: base64Audio, format: ext === 'wav' ? 'wav' : 'mp3' } }
                ]
              }],
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            transcription = aiData.choices?.[0]?.message?.content || '';
          }
        }

        if (!transcription) {
          results.push({ id: record.id, name: record.name, status: 'error', error: 'empty transcription' });
          continue;
        }

        // Save
        const { error: updateError } = await supabase
          .from('sector_brain_examples')
          .update({ text_content: transcription })
          .eq('id', record.id);

        if (updateError) {
          results.push({ id: record.id, name: record.name, status: 'error', error: updateError.message });
        } else {
          results.push({ id: record.id, name: record.name, status: 'success' });
          console.log(`✓ Transcribed: ${record.name} (${transcription.length} chars)`);
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`Error transcribing ${record.name}:`, err);
        results.push({ id: record.id, name: record.name, status: 'error', error: err instanceof Error ? err.message : 'unknown' });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(JSON.stringify({
      success: true,
      total: audioRecords.length,
      transcribed: successCount,
      errors: errorCount,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Batch transcription error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
