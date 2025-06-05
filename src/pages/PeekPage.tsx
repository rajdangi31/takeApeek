import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PostDetail } from '../components/PostDetail';

export const PeekPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <motion.div
      className="min-h-screen px-4 py-6 bg-transparent text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.h1
          className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-neon-pink via-neon-purple to-blue-500 bg-clip-text text-transparent drop-shadow-md"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Peek Details
        </motion.h1>
        <PostDetail postId={Number(id)} />
      </div>
    </motion.div>
  );
};