import { useAuth } from "../contexts/AuthContext"

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export default function usePush() {
  const { user } = useAuth()

  const requestPushPermission = async () => {
    if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const reg = await navigator.serviceWorker.register('/sw.js')
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
    })

    await fetch('https://ijyicqsfverbgsxbtarm.supabase.co/functions/v1/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, subscription: sub })
    })

    console.log('🔔 Subscription saved successfully!')
  }

  return { requestPushPermission }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}
