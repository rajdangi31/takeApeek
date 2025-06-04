// src/services/notificationService.ts
import { supabase } from '../supabase-client'

const VAPID_PUBLIC_KEY = 'BEUFQQcYV4NcHzw2XpCG7Dv3UgqUSzwqSl9QK2ZeHfSeXJN7gjq8SgPf06lD2ACnRT7Kml8H1a8qVW7yUWKMqEHbGw=='

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (!('serviceWorker' in navigator)) {
      console.log('This browser does not support service workers')
      return false
    }

    // Check current permission
    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    // Request permission
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  static async subscribeToPush(userId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission()
      if (!hasPermission) {
        throw new Error('Notification permission denied')
      }

      const registration = await this.registerServiceWorker()
      if (!registration) {
        throw new Error('Service Worker registration failed')
      }

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
      }

      // Save subscription to database
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          push_subscription: JSON.stringify(subscription.toJSON()),
          push_enabled: true 
        })
        .eq('id', userId)

      if (error) {
        console.error('Error saving subscription:', error)
        return false
      }

      console.log('Push subscription saved successfully')
      return true

    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  }

  static async unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return true

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove subscription from database
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          push_subscription: null,
          push_enabled: false 
        })
        .eq('id', userId)

      if (error) {
        console.error('Error removing subscription:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }

  static async sendNotificationToBesties(
    userId: string, 
    title?: string, 
    message?: string, 
    url?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { userId, title, message, url }
      })

      if (error) {
        console.error('Error sending notifications:', error)
        return false
      }

      console.log('Notifications sent:', data)
      return true
    } catch (error) {
      console.error('Error calling notification function:', error)
      return false
    }
  }

  static async isSubscribed(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('push_enabled')
        .eq('id', userId)
        .single()

      return data?.push_enabled || false
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }
}