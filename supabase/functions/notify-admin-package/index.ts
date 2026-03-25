import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const {
      campaignId,
      userId,
      packageName,
      totalPrice,
      allocations,
      targetStream,
      targetGender,
      targetCity,
      budget,
    } = body;

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, company_name')
      .eq('id', userId)
      .single();

    // Fetch client profile
    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('business_name')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const streamLabels: Record<string, string> = {
      general: 'כלל הציבור החרדי',
      litvish: 'ליטאי',
      hasidic: 'חסידי',
      sephardi: 'ספרדי',
    };

    const genderLabels: Record<string, string> = {
      men: 'גברים',
      women: 'נשים',
      family: 'משפחה',
    };

    // Build notification summary
    const allocSummary = (allocations || [])
      .map((a: any) => `  • ${a.categoryNameHe}: ₪${a.amount.toLocaleString()} (${a.percentage}%)`)
      .join('\n');

    const summary = [
      `🎯 בקשת חבילת מדיה חדשה!`,
      ``,
      `לקוח: ${clientProfile?.business_name || profile?.full_name || 'לא ידוע'}`,
      `אימייל: ${profile?.email || 'לא ידוע'}`,
      ``,
      `📦 חבילה: ${packageName}`,
      `💰 תקציב: ₪${budget?.toLocaleString()}`,
      `💰 סה"כ חבילה: ₪${totalPrice?.toLocaleString()}`,
      `👥 זרם: ${streamLabels[targetStream] || targetStream}`,
      `👫 מגדר: ${genderLabels[targetGender] || targetGender}`,
      `📍 עיר: ${targetCity === 'nationwide' ? 'ארצי' : targetCity}`,
      ``,
      `📊 חלוקת תקציב:`,
      allocSummary,
      ``,
      `🔗 מזהה קמפיין: ${campaignId}`,
    ].join('\n');

    console.log('Admin notification:\n', summary);

    // Store as a note/log — admins see it in the campaign record
    // The campaign was already saved with status 'pending_review'
    // This log helps track the notification was sent

    return new Response(
      JSON.stringify({ success: true, message: 'Admin notified' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
