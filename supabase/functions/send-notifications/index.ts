// supabase/functions/send-notifications/index.ts
// @ts-nocheck (Edge runtime)
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import dotenv from 'dotenv';

dotenv.config();


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = process.env.SUPABASE_URL || Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('⛔ SUPABASE_URL / SERVICE_ROLE_KEY missing')
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Helper to validate the stored subscription object
function parseValidSubscription(raw: unknown) {
  if (!raw) throw new Error('push_subscription is null or missing')
  const sub = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (
    typeof sub !== 'object' ||
    typeof sub.endpoint !== 'string' ||
    typeof sub.keys !== 'object' ||
    typeof sub.keys.auth !== 'string' ||
    typeof sub.keys.p256dh !== 'string'
  ) {
    throw new Error('Invalid push_subscription structure')
  }
  return sub
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, message, url } = await req.json()
    if (!userId) throw new Error('userId is required')

    // 1. Find “besties” relations
    const { data: relations, error: relationErr } = await supabaseAdmin
      .from('besties')
      .select('user_id, bestie_id')
      .or(
        `and(user_id.eq.${userId},status.eq.accepted),and(bestie_id.eq.${userId},status.eq.accepted)`
      )
    if (relationErr) throw relationErr

    const friendIds =
      relations?.map((r) =>
        r.user_id === userId ? r.bestie_id : r.user_id
      ) ?? []

    if (!friendIds.length) {
      return new Response(
        JSON.stringify({ message: 'No besties to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch each friend’s push_subscription
    const { data: subs, error: subErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id, push_subscription')
      .in('id', friendIds)
      .not('push_subscription', 'is', null)
    if (subErr) throw subErr
    if (!subs?.length) {
      return new Response(
        JSON.stringify({ message: 'No besties have push enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Resolve poster’s display name
    const { data: poster } = await supabaseAdmin
      .from('user_profiles')
      .select('user_name, email')
      .eq('id', userId)
      .single()
    const posterName =
      poster?.user_name || poster?.email?.split('@')[0] || 'Someone'

    // 4. Build payload template
    const buildPayload = (subscription: any) => ({
      title: title || `${posterName} shared a new peek! 👀`,
      body: message || `Check out what ${posterName} is up to`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: { url: typeof url === 'string' && url.trim() ? url : '/' },
      tag: 'new-peek',
    })

    // 5. For each subscriber, POST to your Vercel push server
    // supabase/functions/send-notifications/index.ts
const PUSH_URL =
  Deno.env.get('PUSH_SERVER_URL') ??
  'https://take-apeek-git-pwa-notifications-raj-s-projects-40feb981.vercel.app';

    const results = await Promise.allSettled(
      subs.map(async (user) => {
        try {
          const subscription = parseValidSubscription(user.push_subscription)
          const payload = buildPayload(subscription)

          // Send to Vercel push‐server
          const resp = await fetch(PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription, payload }),
          })

          if (!resp.ok) {
            const json = await resp.json().catch(() => ({}))
            throw new Error(json.error || `HTTP ${resp.status}`)
          }

          return { success: true, userId: user.id }
        } catch (err) {
          return {
            success: false,
            userId: user.id,
            error: err.message || String(err),
          }
        }
      })
    )

    // 6. Summarize results
    const formatted = results.map((r) =>
      r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise failed' }
    )
    const count = formatted.filter((r) => r.success).length

    return new Response(
      JSON.stringify({ message: `Sent ${count} notifications`, results: formatted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
