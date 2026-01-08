import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const url = new URL(req.url);
    const mediaType = url.searchParams.get('media_type'); // ads, text, video, signage, promo, radio
    const exampleType = url.searchParams.get('example_type'); // good, bad
    const streamType = url.searchParams.get('stream_type'); // hasidic, litvish, general, sephardic
    const genderAudience = url.searchParams.get('gender_audience');
    const topicCategory = url.searchParams.get('topic_category');
    const holidaySeason = url.searchParams.get('holiday_season');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    console.log('Fetching sector brain examples with filters:', {
      mediaType,
      exampleType,
      streamType,
      genderAudience,
      topicCategory,
      holidaySeason,
      limit,
    });

    // Build query
    let query = supabase
      .from('sector_brain_examples')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }
    if (exampleType) {
      query = query.eq('example_type', exampleType);
    }
    if (streamType) {
      query = query.eq('stream_type', streamType);
    }
    if (genderAudience) {
      query = query.eq('gender_audience', genderAudience);
    }
    if (topicCategory) {
      query = query.eq('topic_category', topicCategory);
    }
    if (holidaySeason) {
      query = query.eq('holiday_season', holidaySeason);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data to include full URLs for images
    const transformedData = data?.map(item => {
      const isImage = item.file_type?.startsWith('image/');
      return {
        id: item.id,
        name: item.name,
        type: item.file_type === 'text' ? 'text' : (isImage ? 'image' : 'document'),
        example_type: item.example_type || (item.zone === 'redlines' ? 'bad' : 'good'),
        media_type: item.media_type,
        stream_type: item.stream_type,
        gender_audience: item.gender_audience,
        topic_category: item.topic_category,
        holiday_season: item.holiday_season,
        text_content: item.text_content,
        image_url: isImage && item.file_path 
          ? `${supabaseUrl}/storage/v1/object/public/sector-brain/${item.file_path}` 
          : null,
        description: item.description,
        created_at: item.created_at,
      };
    }) || [];

    console.log(`Returning ${transformedData.length} examples`);

    return new Response(
      JSON.stringify({
        success: true,
        count: transformedData.length,
        examples: transformedData,
        filters: {
          media_type: mediaType,
          example_type: exampleType,
          stream_type: streamType,
          gender_audience: genderAudience,
          topic_category: topicCategory,
          holiday_season: holidaySeason,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
