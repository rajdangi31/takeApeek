// src/components/NotificationSettings.tsx
import { Bell, BellOff, CheckCircle, TestTube } from "lucide-react";
import { usePushNotifications } from "../usePushNotifications";
import { useAuth } from "../contexts/AuthContext";

export const NotificationSettings = () => {
  const { user } = useAuth();
  const {
    isSupported,
    isSubscribed,
    loading,
    subscribeUser,
    unsubscribeUser,
  } = usePushNotifications(user?.id);

  /* -------------------------------------------------- */
  /*  Local helpers                                      */
  /* -------------------------------------------------- */
  const sendTestNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      /*  —— cast to silence lib.dom type gap (TS < 5.2 lacks `vibrate`) —— */
      const opts = {
        body: "Test notification! Your push notifications are working perfectly.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "test-notification",
        vibrate: [200, 100, 200],
        data: { type: "test" },
      } as unknown as NotificationOptions;

      new Notification("Take A Peek 👀", opts);
    }
  };

  /* -------------------------------------------------- */
  /*  Unsupported browser                               */
  /* -------------------------------------------------- */
  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center mb-2">
          <BellOff size={20} className="text-red-500 mr-2" />
          <h3 className="font-semibold text-red-800">Not Supported</h3>
        </div>
        <p className="text-red-600 text-sm">
          Push notifications aren’t available in this browser. Try Chrome,
          Firefox or install the PWA.
        </p>
      </div>
    );
  }

  /* -------------------------------------------------- */
  /*  UI                                                */
  /* -------------------------------------------------- */
  return (
    <div className="space-y-4">
      {/* Main toggle card */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Bell size={20} className="text-blue-600 mr-2" />
            <div>
              <h3 className="font-semibold text-gray-800">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-600">
                Get notified about new peeks and activity
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSubscribed
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isSubscribed ? "Enabled" : "Disabled"}
          </span>
        </div>

        <button
          onClick={isSubscribed ? unsubscribeUser : subscribeUser}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-medium transition ${
            isSubscribed
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white disabled:opacity-50 flex items-center justify-center`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
              {isSubscribed ? "Disabling…" : "Enabling…"}
            </>
          ) : isSubscribed ? (
            <>
              <BellOff size={16} className="mr-2" /> Disable Notifications
            </>
          ) : (
            <>
              <Bell size={16} className="mr-2" /> Enable Notifications
            </>
          )}
        </button>
      </div>

      {/* Test notification card */}
      {isSubscribed && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <CheckCircle size={20} className="text-green-600 mr-2" />
            <h4 className="font-medium text-green-800">Notifications active</h4>
          </div>

          <button
            onClick={sendTestNotification}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
          >
            <TestTube size={16} className="mr-2" />
            Send Test Notification
          </button>
        </div>
      )}

      {/* Static list (placeholder) */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3">Notification Types</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-gray-600">New Peeks from Besties</span>
            <span className="text-green-600 font-medium">✓ Enabled</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">Comments on Your Peeks</span>
            <span className="text-green-600 font-medium">✓ Enabled</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">New Bestie Requests</span>
            <span className="text-green-600 font-medium">✓ Enabled</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">Daily Reminders</span>
            <span className="text-yellow-600 font-medium">Coming Soon</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
