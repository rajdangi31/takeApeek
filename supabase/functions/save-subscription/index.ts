
// supabase/functions/save-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('VITE_SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user from the access token
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    const subscription = await req.json();
    if (!subscription.endpoint) throw new Error('Subscription object is invalid');

    // Use upsert to avoid duplicates. It will update if the endpoint already exists.
    const { error } = await supabaseClient
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});