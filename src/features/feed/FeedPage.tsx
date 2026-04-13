import { FeedList } from "./FeedList";
import { NotificationSettings } from "../notifications/NotificationSettings";
import { motion } from "framer-motion";

export const Home = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-8 pb-4"
      >
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="text-7xl mb-6 relative z-10"
          >
            👀
          </motion.div>
          <div className="absolute inset-0 bg-pink-400 blur-3xl opacity-20 rounded-full animate-pulse" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 font-outfit tracking-tight">
          Peek Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Friends</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto font-medium">
          See what your circle is up to right now in real-time.
        </p>
      </motion.div>

      {/* Notifications Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-md mx-auto"
      >
        <NotificationSettings />
      </motion.div>

      {/* Feed Divider */}
      <div className="flex items-center gap-4 max-w-md mx-auto">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Peeks</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      {/* Posts Feed */}
      <div className="pb-20">
        <FeedList />
      </div>
    </div>
  );
};
