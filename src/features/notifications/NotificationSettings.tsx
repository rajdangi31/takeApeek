import { Bell, BellOff, CheckCircle2, FlaskConical, AlertCircle } from "lucide-react";
import { usePushNotifications } from "./usePushNotifications";
import { useAuth } from "../auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

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
        body: "Test notification! Your push notifications are working perfectly. 🚀",
        icon: "/Logo.png",
        badge: "/Logo.png",
        tag: "test-notification",
        vibrate: [200, 100, 200],
        data: { type: "test" },
      } as unknown as NotificationOptions;

      new Notification("Take A Peek 👀", opts);
    }
  };

  if (!isSupported) {
    return (
      <div className="glass-effect rounded-[2rem] p-6 border-red-100/50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
             <BellOff size={24} />
        </div>
        <div>
          <h3 className="font-outfit font-bold text-red-800 tracking-tight">Not Supported</h3>
          <p className="text-red-600/70 text-xs font-medium">
            Push notifications aren't available in this browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main toggle card */}
      <div className="glass-effect rounded-[2.5rem] p-8 border-white/60 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
             <Bell size={100} />
        </div>

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isSubscribed ? 'bg-pink-50 text-pink-500' : 'bg-slate-50 text-slate-400'}`}>
                    {isSubscribed ? <Bell size={28} className="animate-float" /> : <BellOff size={28} />}
                </div>
                <div>
                  <h3 className="font-outfit font-extrabold text-slate-900 text-xl tracking-tight">
                    Notifications
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Get alerted for friend activity
                  </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                 <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={isSubscribed ? 'on' : 'off'}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border ${
                    isSubscribed
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}
                >
                    {isSubscribed ? "Active" : "Disabled"}
                </motion.span>
            </AnimatePresence>
            </div>

            <button
            onClick={isSubscribed ? unsubscribeUser : subscribeUser}
            disabled={loading}
            className={`w-full px-6 py-5 rounded-[1.5rem] font-bold font-outfit uppercase tracking-wider text-sm transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3
                ${isSubscribed
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-pink-500 text-white hover:bg-pink-600 shadow-pink-200"
                }
            `}
            >
            {loading ? (
                <>
                <div className="animate-spin w-5 h-5 border-3 border-white/30 border-t-white rounded-full" />
                <span>Processing...</span>
                </>
            ) : isSubscribed ? (
                <>
                <BellOff size={18} /> Disable Alerts
                </>
            ) : (
                <>
                <Bell size={18} /> Enable Alerts
                </>
            )}
            </button>
        </div>
      </div>

      <AnimatePresence>
        {isSubscribed && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-effect rounded-[2rem] p-6 border-green-100/50 flex flex-col md:flex-row items-center justify-between gap-4"
            >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                     <CheckCircle2 size={20} />
                </div>
                <h4 className="font-outfit font-bold text-slate-800">Connection optimized</h4>
            </div>

            <button
                onClick={sendTestNotification}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
                <FlaskConical size={14} />
                Send Pulse
            </button>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-effect rounded-[2rem] p-6 border-white/40">
        <h4 className="font-outfit font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
             <AlertCircle size={12} /> Live Channels
        </h4>
        <ul className="space-y-4">
          <li className="flex justify-between items-center group">
            <span className="text-slate-600 font-medium text-sm">Post Subscriptions</span>
            <span className="text-green-500 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Realtime</span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-slate-600 font-medium text-sm">Interaction Pushes</span>
            <span className="text-green-500 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Active</span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-slate-600 font-medium text-sm">Friendship Handshakes</span>
            <span className="text-green-500 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Syncing</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
