import { motion } from 'framer-motion';
import { PostList } from '../components/PostList';
import { NotificationSettings } from '../components/NotificationSettings';

export const Home = () => {
  return (
    <motion.div
      className="space-y-10 bg-transparent min-h-screen text-white pb-10"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="text-center py-12"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="bg-gradient-to-br from-neon-pink to-neon-purple rounded-3xl shadow-neumorphic max-w-md mx-auto p-10 border border-neon-pink/30 backdrop-blur-md"
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 46, 99, 0.7)' }}
        >
          <motion.div
            className="flex items-center justify-center mb-5"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-6xl">👀</div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-wide drop-shadow-md">
            Peek your besties!
          </h1>
          <p className="text-neon-pink/80 text-sm">
            See what your friends are up to right now
          </p>
        </motion.div>
      </motion.div>
      <div className="max-w-md mx-auto px-4">
        <NotificationSettings />
      </div>
      <div className="space-y-6 px-4">
        <PostList />
      </div>
    </motion.div>
  );
};