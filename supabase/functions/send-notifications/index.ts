// supabase/functions/send-notifications/index.ts
// @ts-nocheck  (Edge runtime – no Node typings)
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/* ────────────────────────────────────────────────────────── */
/*  Runtime env                                              */
/* ────────────────────────────────────────────────────────── */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''

if (!SUPABASE_URL || !SERVICE_ROLE_KEY)
  console.error('⛔ SUPABASE_URL / SERVICE_ROLE_KEY missing')
if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY)
  console.error('⛔ VAPID keys missing – push will fail')

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

/* ────────────────────────────────────────────────────────── */
/*  Helper – safe sub parse                                   */
/* ────────────────────────────────────────────────────────── */
function parseSubscription(raw: unknown) {
  if (!raw) throw new Error('push_subscription is null')
  if (typeof raw === 'string') return JSON.parse(raw)
  if (typeof raw === 'object') return raw
  throw new Error('Un-recognised push_subscription format')
}

/* ────────────────────────────────────────────────────────── */
/*  Handler                                                  */
/* ────────────────────────────────────────────────────────── */
serve(async (req) => {
  /* CORS pre-flight */
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, message, title, url } = await req.json()
    if (!userId) throw new Error('userId is required')

    /* ------------------------------------------------------ */
    /*  1. Friend list                                        */
    /* ------------------------------------------------------ */
    const { data: friends, error: bestieErr } = await supabaseAdmin
      .from('besties')
      .select('user_id, bestie_id')
      .or(
        `and(user_id.eq.${userId},status.eq.accepted),and(bestie_id.eq.${userId},status.eq.accepted)`
      )

    if (bestieErr) throw bestieErr
    const friendIds =
      friends?.map((r) =>
        r.user_id === userId ? r.bestie_id : r.user_id
      ) ?? []

    if (friendIds.length === 0)
      return new Response(
        JSON.stringify({ message: 'No besties to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    /* ------------------------------------------------------ */
    /*  2. Subscriptions                                      */
    /* ------------------------------------------------------ */
    const { data: subs, error: subErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id, push_subscription')
      .in('id', friendIds)
      .not('push_subscription', 'is', null)

    if (subErr) throw subErr
    if (!subs?.length)
      return new Response(
        JSON.stringify({ message: 'No besties have push enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    /* ------------------------------------------------------ */
    /*  3. Poster name                                        */
    /* ------------------------------------------------------ */
    const { data: poster } = await supabaseAdmin
      .from('user_profiles')
      .select('user_name, email')
      .eq('id', userId)
      .single()

    const posterName =
      poster?.user_name || poster?.email?.split('@')[0] || 'Someone'

    /* ------------------------------------------------------ */
    /*  4. Web-push setup                                     */
    /* ------------------------------------------------------ */
    const { default: webpush } = await import(
      'https://esm.sh/web-push@3.6.6'
    )
    webpush.setVapidDetails(
      'mailto:dangiprince263@gmail.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    /* ------------------------------------------------------ */
    /*  5. Fan-out                                            */
    /* ------------------------------------------------------ */
    const sendAll = subs.map(async (user) => {
      try {
        const subscription = parseSubscription(user.push_subscription)

        const payload = {
          title: title || `${posterName} shared a new peek! 👀`,
          body: message || `Check out what ${posterName} is up to`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          url: url || '/',
          tag: 'new-peek',
        }

        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload)
        )

        return { success: true, userId: user.id }
      } catch (err) {
        return {
          success: false,
          userId: user.id,
          error: err?.message ?? String(err),
        }
      }
    })

    const results = await Promise.all(sendAll)
    const successCount = results.filter((r) => r.success).length

    return new Response(
      JSON.stringify({ message: `Sent ${successCount} notifications`, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
