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

  const sendTestNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
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

  if (!isSupported) {
    return (
      <div className="p-6 bg-[#1a1a2e] rounded-xl border border-red-500 text-red-400">
        <div className="flex items-center mb-2">
          <BellOff size={20} className="text-red-500 mr-2" />
          <h3 className="font-semibold">Not Supported</h3>
        </div>
        <p className="text-sm">
          Push notifications aren’t available in this browser. Try Chrome,
          Firefox, or install the PWA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Notification Toggle */}
      <div className="p-5 bg-[#12121c] rounded-2xl border border-pink-600 shadow-[0_0_25px_#ec489980]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Bell size={22} className="text-pink-500" />
            <div>
              <h3 className="text-white font-bold">Push Notifications</h3>
              <p className="text-sm text-gray-400">
                Get notified about new peeks and activity.
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSubscribed
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {isSubscribed ? "Enabled" : "Disabled"}
          </span>
        </div>

        <button
          onClick={isSubscribed ? unsubscribeUser : subscribeUser}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition flex items-center justify-center ${
            isSubscribed
              ? "bg-red-600 hover:bg-red-700"
              : "bg-pink-500 hover:bg-pink-600"
          } disabled:opacity-50`}
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

      {/* Test Notification */}
      {isSubscribed && (
        <div className="p-5 bg-[#102a19] border border-green-600 rounded-2xl shadow-[0_0_20px_#22c55e60]">
          <div className="flex items-center mb-2">
            <CheckCircle size={20} className="text-green-500 mr-2" />
            <h4 className="font-medium text-green-400">Notifications Active</h4>
          </div>

          <button
            onClick={sendTestNotification}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center transition"
          >
            <TestTube size={16} className="mr-2" />
            Send Test Notification
          </button>
        </div>
      )}

      {/* Static Notification Types */}
      <div className="p-5 bg-[#1c1c29] rounded-2xl border border-gray-700">
        <h4 className="font-semibold text-white mb-3">Notification Types</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex justify-between">
            <span>New Peeks from Besties</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </li>
          <li className="flex justify-between">
            <span>Comments on Your Peeks</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </li>
          <li className="flex justify-between">
            <span>New Bestie Requests</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </li>
          <li className="flex justify-between">
            <span>Daily Reminders</span>
            <span className="text-yellow-400 font-medium">Coming Soon</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
