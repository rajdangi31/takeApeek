// src/services/notificationService.ts
import { supabase } from '../supabase-client'

/* -------------------------------------------------- */
/*  PUBLIC VAPID KEY                                  */
/* -------------------------------------------------- */
//  👉  Make sure .env contains:
//      VITE_VAPID_PUBLIC_KEY=<your-public-key>
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
if (!VAPID_PUBLIC_KEY) {
  // Hard-stop in dev – the browser can’t subscribe without it
  console.error(
    '❌  VITE_VAPID_PUBLIC_KEY is not defined. ' +
    'Add it to your .env and restart Vite.'
  )
}

/* -------------------------------------------------- */
/*  Helper: convert Base-64 to Uint8Array              */
/* -------------------------------------------------- */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/* -------------------------------------------------- */
/*  Notification Service                              */
/* -------------------------------------------------- */
export class NotificationService {
  /* ---------- permission helpers ---------- */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notifications or Service Workers not supported')
      return false
    }

    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    return (await Notification.requestPermission()) === 'granted'
  }

  /* ---------- service-worker register ---------- */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null
    try {
      return await navigator.serviceWorker.register('/sw.js')
    } catch (err) {
      console.error('SW registration failed:', err)
      return null
    }
  }

  /* ---------- subscribe ---------- */
  static async subscribeToPush(userId: string): Promise<boolean> {
    try {
      if (!VAPID_PUBLIC_KEY) throw new Error('Missing VAPID public key')
      if (!(await this.requestPermission())) throw new Error('Permission denied')

      const reg = await this.registerServiceWorker()
      if (!reg) throw new Error('SW registration failed')

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          push_subscription: JSON.stringify(sub.toJSON()),
          push_enabled: true,
        })
        .eq('id', userId)

      if (error) throw error
      console.log('✅ Push subscription saved')
      return true
    } catch (err) {
      console.error('Subscribe error:', err)
      return false
    }
  }

  /* ---------- unsubscribe ---------- */
  static async unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      await sub?.unsubscribe()

      const { error } = await supabase
        .from('user_profiles')
        .update({ push_subscription: null, push_enabled: false })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Unsubscribe error:', err)
      return false
    }
  }

  /* ---------- invoke edge function ---------- */
  static async sendNotificationToBesties(
    userId: string,
    title?: string,
    message?: string,
    url?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-notifications',
        { body: { userId, title, message, url } }
      )
      if (error) throw error
      console.log('Edge function result:', data)
      return true
    } catch (err) {
      console.error('sendNotificationToBesties error:', err)
      return false
    }
  }

  /* ---------- simple helper ---------- */
  static async isSubscribed(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_profiles')
      .select('push_enabled')
      .eq('id', userId)
      .single()
    return data?.push_enabled ?? false
  }
}
