import { Bell, BellOff, CheckCircle, TestTube } from "lucide-react";
import { usePushNotifications } from "../usePushNotifications";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

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
      <motion.div
        className="p-6 bg-dark-glass rounded-2xl border border-red-500/30 text-red-400 backdrop-blur-md shadow-neumorphic"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-3">
          <BellOff size={20} className="text-red-400 mr-3" />
          <h3 className="font-semibold text-neon-pink">Not Supported</h3>
        </div>
        <p className="text-sm text-red-400/80">
          Push notifications aren’t available in this browser. Try Chrome,
          Firefox, or install the PWA.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6 max-w-md mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Notification Toggle */}
      <motion.div
        className="p-6 bg-dark-glass rounded-2xl border border-neon-pink/30 shadow-glow backdrop-blur-md"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell size={22} className="text-neon-pink" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold text-lg">Push Notifications</h3>
              <p className="text-sm text-neon-pink/80">
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

        <motion.button
          onClick={isSubscribed ? unsubscribeUser : subscribeUser}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition flex items-center justify-center shadow-glow ${
            isSubscribed
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gradient-to-r from-neon-pink to-neon-purple hover:from-neon-purple hover:to-neon-pink"
          } disabled:opacity-50`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
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
        </motion.button>
      </motion.div>

      {/* Test Notification */}
      {isSubscribed && (
        <motion.div
          className="p-6 bg-dark-glass border border-green-600/30 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-md"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <CheckCircle size={20} className="text-green-400 mr-3" />
            </motion.div>
            <h4 className="font-medium text-green-400">Notifications Active</h4>
          </div>

          <motion.button
            onClick={sendTestNotification}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center transition shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TestTube size={16} className="mr-2" />
            Send Test Notification
          </motion.button>
        </motion.div>
      )}

      {/* Static Notification Types */}
      <motion.div
        className="p-6 bg-dark-glass rounded-2xl border border-neon-pink/20 backdrop-blur-md shadow-neumorphic"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <h4 className="font-semibold text-neon-pink mb-4 text-lg">
          Notification Types
        </h4>
        <ul className="space-y-3 text-sm text-gray-300">
          <motion.li
            className="flex justify-between"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <span>New Peeks from Besties</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </motion.li>
          <motion.li
            className="flex justify-between"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <span>Comments on Your Peeks</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </motion.li>
          <motion.li
            className="flex justify-between"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <span>New Bestie Requests</span>
            <span className="text-green-400 font-medium">✓ Enabled</span>
          </motion.li>
          <motion.li
            className="flex justify-between"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <span>Daily Reminders</span>
            <span className="text-yellow-400 font-medium">Coming Soon</span>
          </motion.li>
        </ul>
      </motion.div>
    </motion.div>
  );
};