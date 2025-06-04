// supabase/functions/send-notifications/index.ts
// @ts-nocheck (Edge runtime – no Node typings)
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ────────────────────────────────────────────────────────── */
/*  Runtime env                                               */
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
/*  Helper – safe subscription validator                      */
/* ────────────────────────────────────────────────────────── */
function parseValidSubscription(raw: unknown) {
  console.log('🔍 Parsing subscription:', typeof raw, raw)
  
  if (!raw) throw new Error('push_subscription is null or missing')

  const sub = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (
    typeof sub !== 'object' ||
    typeof sub.endpoint !== 'string' ||
    typeof sub.keys !== 'object' ||
    typeof sub.keys.auth !== 'string' ||
    typeof sub.keys.p256dh !== 'string'
  ) {
    console.error('❌ Invalid subscription structure:', sub)
    throw new Error('Invalid push_subscription structure')
  }

  console.log('✅ Valid subscription parsed')
  return sub
}

/* ────────────────────────────────────────────────────────── */
/*  Handler                                                   */
/* ────────────────────────────────────────────────────────── */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Function started')
    
    const { userId, title, message, url } = await req.json()
    console.log('📥 Request data:', { userId, title, message, url })
    
    if (!userId) throw new Error('userId is required')

    /* ------------------------------------------------------ */
    /*  1. Find accepted besties                              */
    /* ------------------------------------------------------ */
    console.log('🔍 Finding besties for user:', userId)
    
    const { data: relations, error: relationErr } = await supabaseAdmin
      .from('besties')
      .select('user_id, bestie_id')
      .or(
        `and(user_id.eq.${userId},status.eq.accepted),and(bestie_id.eq.${userId},status.eq.accepted)`
      )

    if (relationErr) {
      console.error('❌ Relation error:', relationErr)
      throw relationErr
    }

    const friendIds = relations?.map((r) =>
      r.user_id === userId ? r.bestie_id : r.user_id
    ) ?? []

    console.log('👥 Found friend IDs:', friendIds)

    if (!friendIds.length) {
      console.log('😴 No besties found')
      return new Response(
        JSON.stringify({ message: 'No besties to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    /* ------------------------------------------------------ */
    /*  2. Fetch their push subscriptions                     */
    /* ------------------------------------------------------ */
    console.log('🔔 Fetching push subscriptions...')
    
    const { data: subs, error: subErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id, push_subscription')
      .in('id', friendIds)
      .not('push_subscription', 'is', null)

    if (subErr) {
      console.error('❌ Subscription error:', subErr)
      throw subErr
    }
    
    console.log('📱 Found subscriptions:', subs?.length || 0)
    
    if (!subs?.length) {
      console.log('😴 No push subscriptions found')
      return new Response(
        JSON.stringify({ message: 'No besties have push enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    /* ------------------------------------------------------ */
    /*  3. Get poster display name                            */
    /* ------------------------------------------------------ */
    const { data: poster } = await supabaseAdmin
      .from('user_profiles')
      .select('user_name, email')
      .eq('id', userId)
      .single()

    const posterName =
      poster?.user_name || poster?.email?.split('@')[0] || 'Someone'
    
    console.log('👤 Poster name:', posterName)

    /* ------------------------------------------------------ */
    /*  4. Setup WebPush                                      */
    /* ------------------------------------------------------ */
    console.log('📦 Importing web-push...')
    
    try {
      const { default: webpush } = await import('https://esm.sh/web-push@3.6.6')
      console.log('✅ Web-push imported')

      webpush.setVapidDetails(
        'mailto:dangiprince263@gmail.com',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      )
      
      console.log('🔧 VAPID details set')

      /* ------------------------------------------------------ */
      /*  5. Send notifications                                 */
      /* ------------------------------------------------------ */
      console.log('📤 Sending notifications...')
      
      const results = await Promise.allSettled(
        subs.map(async (user) => {
          try {
            console.log(`🔄 Processing user ${user.id}`)
            
            const subscription = parseValidSubscription(user.push_subscription)

            const payload = {
              title: title || `${posterName} shared a new peek! 👀`,
              body: message || `Check out what ${posterName} is up to`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              url: url || '/',
              tag: 'new-peek',
            }

            console.log('📤 Sending to:', user.id)
            console.log('📦 Final payload to send:', JSON.stringify(payload))
            console.log('📬 Subscription object:', JSON.stringify(subscription))

            await webpush.sendNotification(subscription, JSON.stringify(payload))
            console.log('✅ Sent to:', user.id)

            return { success: true, userId: user.id }
          } catch (err) {
            console.error(`❌ Failed for user ${user.id}:`, err)
            return {
              success: false,
              userId: user.id,
              error: err?.message || String(err),
            }
          }
        })
      )

      const formatted = results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise failed' }
      )

      const count = formatted.filter((r) => r.success).length
      console.log(`🎉 Successfully sent ${count} notifications`)

      return new Response(
        JSON.stringify({ message: `Sent ${count} notifications`, results: formatted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      
    } catch (webpushError) {
      console.error('💥 Web-push import/setup error:', webpushError)
      throw new Error(`Web-push error: ${webpushError.message}`)
    }
    
  } catch (err) {
    console.error('❌ send-notifications error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})