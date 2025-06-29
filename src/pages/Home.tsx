// Home.tsx
import { useState } from "react"
import usePush from "../hooks/usePush"
import { PostList } from "../components/PostList"

export const Home = () => {
  const { requestPushPermission } = usePush()
  const [isRequesting, setIsRequesting] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied'>('default')

  const handlePushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    // Check current permission status
    if (Notification.permission === 'granted') {
      setNotificationStatus('granted')
      return
    }

    if (Notification.permission === 'denied') {
      setNotificationStatus('denied')
      alert('Notifications are blocked. Please enable them in your browser settings.')
      return
    }

    setIsRequesting(true)
    try {
      await requestPushPermission()
      // Check the permission after request
      setNotificationStatus(Notification.permission as 'granted' | 'denied')
    } catch (error) {
      console.error('Error requesting push permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const getButtonText = () => {
    if (isRequesting) return '🔄 Requesting...'
    if (notificationStatus === 'granted') return '✅ Notifications Enabled'
    if (notificationStatus === 'denied') return '❌ Notifications Blocked'
    return '🔔 Enable Notifications'
  }

  const getButtonStyle = () => {
    if (notificationStatus === 'granted') 
      return "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl"
    if (notificationStatus === 'denied') 
      return "bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl"
    return "bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-xl"
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-pink-100">
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl">👀</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Peek your besties!
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            See what your friends are up to right now
          </p>
          <button
            onClick={handlePushPermission}
            disabled={isRequesting || notificationStatus === 'granted'}
            className={getButtonStyle()}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
      <div className="space-y-6">
        <PostList />
      </div>
    </div>
  )
}