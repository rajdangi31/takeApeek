import { motion } from 'framer-motion';
import { SharePeek } from '../components/SharePeek';

export const ShareAPeekPage = () => {
  return (
    <motion.div
      className="min-h-screen py-10 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-purple rounded-2xl shadow-glow backdrop-blur-md"
            whileHover={{ scale: 1.05 }}
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              Share a Peek!
            </h2>
          </motion.div>
          <p className="text-gray-300 mt-3 text-sm">
            Snap a moment and let your besties in on it
          </p>
        </motion.div>
        <SharePeek />
      </div>
    </motion.div>
  );
};