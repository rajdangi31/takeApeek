// src/components/NotificationSettings.tsx
import { usePushNotifications } from '../usePushNotifications';
import { useAuth } from '../contexts/AuthContext';
import { Bell, BellOff, TestTube, CheckCircle } from 'lucide-react';

export const NotificationSettings = () => {
  const { user } = useAuth();
  const {
    isSupported,
    isSubscribed,
    loading,
    subscribeUser,
    unsubscribeUser
  } = usePushNotifications(user?.id);

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Take A Peek 👀', {
  body: 'Test notification! Your push notifications are working perfectly.',
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  tag: 'test-notification',
  data: { type: 'test' },
  vibrate: [200, 100, 200],
} as any);

    }
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center mb-2">
          <BellOff className="text-red-500 mr-2" size={20} />
          <h3 className="font-semibold text-red-800">Not Supported</h3>
        </div>
        <p className="text-red-600 text-sm">
          Push notifications are not supported in this browser. Try using Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Bell className="text-blue-600 mr-2" size={20} />
            <div>
              <h3 className="font-semibold text-gray-800">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-600">
                Get notified about new peeks and updates
              </p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isSubscribed ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        
        <button
          onClick={isSubscribed ? unsubscribeUser : subscribeUser}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isSubscribed
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isSubscribed ? 'Disabling...' : 'Enabling...'}
            </div>
          ) : (
            <div className="flex items-center">
              {isSubscribed ? (
                <>
                  <BellOff className="mr-2" size={16} />
                  Disable Notifications
                </>
              ) : (
                <>
                  <Bell className="mr-2" size={16} />
                  Enable Notifications
                </>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Test Notification */}
      {isSubscribed && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={20} />
              <div>
                <h4 className="font-medium text-green-800">
                  Notifications Active!
                </h4>
                <p className="text-sm text-green-600">
                  You'll receive updates about new peeks and activity
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={sendTestNotification}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <TestTube className="mr-2" size={16} />
            Send Test Notification
          </button>
        </div>
      )}

      {/* Notification Types */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3">Notification Types</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">New Peeks from Besties</span>
            <span className="text-green-600 font-medium">✓ Enabled</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Comments on Your Peeks</span>
            <span className="text-green-600 font-medium">✓ Enabled</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">New Bestie Requests</span>
            <span className="text-green-600 font-medium">✓ Enabled</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Daily Reminders</span>
            <span className="text-yellow-600 font-medium">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};