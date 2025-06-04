// api/send.js
import webpush from 'web-push'
import dotenv from 'dotenv'

// Load VAPID keys from Vercel's Environment Variables
dotenv.config()

// Make sure these are set in Vercel's dashboard (see step 3 below)
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('VAPID keys are missing')
}

webpush.setVapidDetails(
  'mailto:dangiprince263@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { subscription, payload } = req.body
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Push failed:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
