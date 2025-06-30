import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase-client'

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
// @ts-ignore – debug: expose key for console check
if (import.meta.env.PROD) window.__PUBLIC_VAPID = PUBLIC_KEY;

export default function usePush() {
  const { user } = useAuth()

  const requestPushPermission = async () => {
    if (!user || !('Notification' in window) || !('serviceWorker' in navigator))
      return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    /* register SW (skip if already registered) */
    const reg = await navigator.serviceWorker.register('/sw.js')

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    })

    /* grab JWT */
    const { data } = await supabase.auth.getSession()
    const accessToken = data?.session?.access_token
    if (!accessToken) {
      console.error('No Supabase access token; cannot save subscription')
      return
    }

    /* send to Edge Function */
    const res = await fetch(
      'https://ijyicqsfverbgsxbtarm.supabase.co/functions/v1/save-subscription',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          subscription: sub, // PushSubscription has toJSON(), so this is fine
        }),
      }
    )

    if (res.ok) {
      console.log('🔔 Subscription saved successfully!')
    } else {
      console.error('❌ Failed to save subscription:', await res.text())
    }
  }

  return { requestPushPermission }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}
