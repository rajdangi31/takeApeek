// src/components/NotificationSettings.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { NotificationService } from '../services/notificationService'

export const NotificationSettings = () => {
  const { user } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setIsSupported(supported)

    if (user && supported) {
      checkSubscriptionStatus()
    }
  }, [user])

  const checkSubscriptionStatus = async () => {
    if (!user) return
    
    try {
      const subscribed = await NotificationService.isSubscribed(user.id)
      setIsSubscribed(subscribed)
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
  }

  const handleToggleNotifications = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)

    try {
      if (isSubscribed) {
        const success = await NotificationService.unsubscribeFromPush(user.id)
        if (success) {
          setIsSubscribed(false)
        } else {
          setError('Failed to disable notifications')
        }
      } else {
        const success = await NotificationService.subscribeToPush(user.id)
        if (success) {
          setIsSubscribed(true)
        } else {
          setError('Failed to enable notifications. Please check your browser permissions.')
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error)
      setError('An error occurred while updating notification settings')
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      await NotificationService.sendNotificationToBesties(
        user.id,
        'Test Notification 🧪',
        'This is a test notification to your besties!',
        '/'
      )
      
      // Also show a local notification for testing
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'If you can see this, notifications are working!',
          icon: '/icon-192x192.png'
        })
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      setError('Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center text-gray-500">
        Please sign in to manage notification settings
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🔔 Notification Settings
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-500">
              Get notified when your besties share new peeks
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isSubscribed 
                ? 'bg-pink-600' 
                : 'bg-gray-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSubscribed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isSubscribed && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              ✅ You'll receive notifications when your besties share new peeks!
            </p>
          </div>
        )}

        {isSubscribed && (
          <button
            onClick={testNotification}
            disabled={isLoading}
            className="w-full bg-pink-100 text-pink-700 py-2 px-4 rounded-md hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? 'Sending...' : 'Send Test Notification'}
          </button>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Only your besties will receive notifications</li>
            <li>You'll get notified when they share new peeks</li>
            <li>Notifications work even when the app is closed</li>
            <li>You can disable them anytime</li>
          </ul>
        </div>
      </div>
    </div>
  )
}