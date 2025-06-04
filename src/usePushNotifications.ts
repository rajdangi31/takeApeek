// src/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase-client'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

// 👉 read from .env
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
if (!VAPID_PUBLIC) {
  console.error(
    '❌  VITE_VAPID_PUBLIC_KEY not found in env. Push subscriptions will fail.'
  )
}

/** Convert a URL-safe Base-64 key to the Uint8Array Push API expects */
function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/** Check for **minimum** Push-API support (https + SW + PushManager) */
function hasPushSupport() {
  const secure =
    location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
  return (
    secure &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export const usePushNotifications = (userId?: string) => {
  /* ---------- state ---------- */
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState<unknown>(null)

  /* ---------- feature-detect once ---------- */
  useEffect(() => {
    setIsSupported(hasPushSupport())
  }, [])

  /* ---------- helper to read existing sub ---------- */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return
    try {
      const reg = await navigator.serviceWorker.ready
      const current = await reg.pushManager.getSubscription()
      setSubscription(current)
      setIsSubscribed(Boolean(current))
    } catch (err) {
      console.error('checkSubscription failed:', err)
      setLastError(err)
    }
  }, [isSupported])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  /* ---------- subscribe ---------- */
  const subscribeUser = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC) {
      console.log('Push not supported or missing VAPID key')
      return
    }
    if (!userId) {
      setLastError(new Error('User ID is required'))
      return
    }

    setLoading(true)
    setLastError(null)

    try {
      const reg = await navigator.serviceWorker.ready

      // Ask permission first
      const permission = await Notification.requestPermission()
      if (permission !== 'granted')
        throw new Error(`Notification permission: ${permission}`)

      // Subscribe (or reuse)
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        }))

      // Persist
      const { error } = await supabase
        .from('user_profiles')
        .update({
          push_subscription: JSON.stringify(sub.toJSON()),
          push_enabled: true,
        })
        .eq('id', userId)

      if (error) throw error

      setSubscription(sub)
      setIsSubscribed(true)
    } catch (err) {
      console.error('subscribeUser failed:', err)
      setLastError(err)
    } finally {
      setLoading(false)
    }
  }, [isSupported, userId])

  /* ---------- unsubscribe ---------- */
  const unsubscribeUser = useCallback(async () => {
    if (!subscription || !userId) return
    setLoading(true)
    setLastError(null)

    try {
      await subscription.unsubscribe()
      const { error } = await supabase
        .from('user_profiles')
        .update({ push_subscription: null, push_enabled: false })
        .eq('id', userId)
      if (error) throw error
      setSubscription(null)
      setIsSubscribed(false)
    } catch (err) {
      console.error('unsubscribeUser failed:', err)
      setLastError(err)
    } finally {
      setLoading(false)
    }
  }, [subscription, userId])

  return {
    isSupported,
    isSubscribed,
    loading,
    lastError,
    subscribeUser,
    unsubscribeUser,
    checkSubscription,
  }
}
