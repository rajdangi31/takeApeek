// notify.js
import express from 'express'
import webpush from 'web-push'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

// Load VAPID keys from .env
const { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY } = process.env

webpush.setVapidDetails(
  'mailto:dangiprince263@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

app.post('/send', async (req, res) => {
  const { subscription, payload } = req.body

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ Push failed:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(3000, () => {
  console.log('✅ Push server running on http://localhost:3000')
})
