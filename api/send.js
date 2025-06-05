// api/send.js
//
// A tiny “push-proxy” that Supabase (or curl) can POST to.
// Handles CORS, supports a simple health-check, and won’t crash
// if ENV vars are missing in Preview builds.

import webpush from 'web-push'
import dotenv from 'dotenv'

// Load .env (local) or Vercel env vars (production / preview)
dotenv.config()

const {
  VAPID_PUBLIC_KEY = '',
  VAPID_PRIVATE_KEY = '',
  NODE_ENV = 'development', // default so the file still runs locally
} = process.env

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn(
    '[push] ⚠️  Missing VAPID keys – notifications will fail ' +
      '(set VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY in Vercel → Settings → Environment Variables)',
  )
}

// Initialise web-push even if keys are missing (prevents crashes in dev)
try {
  webpush.setVapidDetails(
    'mailto:dangiprince263@gmail.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  )
} catch {
  /* noop */
}

// ------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Convenience: curl -X GET /api/send → 200 OK
// Supabase Edge function’s “sanity ping” can hit this too.
function handleHealthCheck(res) {
  res.setHeader('Content-Type', 'application/json')
  res.writeHead(200, corsHeaders)
  res.end(JSON.stringify({ ok: true, env: NODE_ENV }))
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------

export default async function handler(req, res) {
  // CORS pre-flight ────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    return res.end()
  }

  // Simple GET → health-check  ─────────────────────────────────────
  if (req.method === 'GET') return handleHealthCheck(res)

  // Only POST is allowed for push payloads
  if (req.method !== 'POST') {
    res.writeHead(405, { ...corsHeaders, Allow: 'POST' })
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
  }

  // Actual push call  ──────────────────────────────────────────────
  try {
    const { subscription, payload } = req.body || {}

    if (!subscription || !payload) {
      throw new Error('subscription and payload are required')
    }

    await webpush.sendNotification(subscription, JSON.stringify(payload))

    res.writeHead(200, corsHeaders)
    return res.end(JSON.stringify({ success: true }))
  } catch (err) {
    console.error('[push] ❌', err)
    res.writeHead(500, corsHeaders)
    return res.end(JSON.stringify({ success: false, error: err.message }))
  }
}
