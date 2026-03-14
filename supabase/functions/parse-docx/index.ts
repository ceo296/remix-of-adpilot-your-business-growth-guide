import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract text from DOCX (ZIP containing XML)
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  // Use Deno's built-in ZIP support via streams
  const { ZipReader, BlobReader, TextWriter } = await import('https://deno.land/x/zipjs@v2.7.34/index.js');
  
  const blob = new Blob([arrayBuffer]);
  const zipReader = new ZipReader(new BlobReader(blob));
  const entries = await zipReader.getEntries();
  
  let documentXml = '';
  
  for (const entry of entries) {
    if (entry.filename === 'word/document.xml') {
      const writer = new TextWriter();
      documentXml = await entry.getData!(writer);
      break;
    }
  }
  
  await zipReader.close();
  
  if (!documentXml) {
    return '';
  }
  
  // Parse XML and extract text content
  // Remove XML tags but preserve paragraph breaks
  let text = documentXml
    // Add newlines for paragraph endings
    .replace(/<\/w:p>/g, '\n')
    // Add space for tab characters
    .replace(/<w:tab\/>/g, '\t')
    // Remove all XML tags
    .replace(/<[^>]+>/g, '')
    // Decode XML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}

// Extract text from plain text-based formats
function extractTextFromPlain(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(arrayBuffer).trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { file_path, record_id } = await req.json();
    
    if (!file_path || !record_id) {
      return new Response(JSON.stringify({ error: 'Missing file_path or record_id' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('sector-brain')
      .download(file_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download file', details: downloadError?.message }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    let extractedText = '';

    const isDocx = file_path.endsWith('.docx') || file_path.includes('.docx');
    const isDoc = file_path.endsWith('.doc');
    const isTxt = file_path.endsWith('.txt') || file_path.endsWith('.rtf');

    if (isDocx) {
      extractedText = await extractTextFromDocx(arrayBuffer);
    } else if (isTxt) {
      extractedText = extractTextFromPlain(arrayBuffer);
    } else if (isDoc) {
      // Old .doc format - try as text (limited support)
      extractedText = extractTextFromPlain(arrayBuffer);
      // Clean binary artifacts
      extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    }

    if (!extractedText) {
      return new Response(JSON.stringify({ 
        success: true, 
        text: '', 
        message: 'No text could be extracted' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Truncate very long texts (keep first 10000 chars)
    if (extractedText.length > 10000) {
      extractedText = extractedText.substring(0, 10000) + '\n...[קוצר]';
    }

    // Update the DB record with extracted text
    const { error: updateError } = await supabase
      .from('sector_brain_examples')
      .update({ text_content: extractedText })
      .eq('id', record_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update record', details: updateError.message }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Extracted ${extractedText.length} chars from ${file_path}`);

    return new Response(JSON.stringify({ 
      success: true, 
      text_length: extractedText.length,
      preview: extractedText.substring(0, 200),
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Parse error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
