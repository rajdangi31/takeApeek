import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Peeks } from './PostList';

interface Props {
  post: Peeks;
}

export const PostItem = ({ post }: Props) => {
  const username = post.user_email?.split('@')[0] || 'anonymous';

  return (
    <motion.div
      className="max-w-md mx-auto bg-gradient-to-br from-neon-pink/50 via-neon-purple/50 to-blue-500/50 rounded-3xl shadow-glow overflow-hidden hover:scale-[1.02] transition-transform duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * (post.id % 5) }}
      whileHover={{ boxShadow: '0 0 40px rgba(255, 46, 99, 0.7)' }}
    >
      <Link to={`/post/${post.id}`}>
        <div className="flex items-center px-5 pt-5 pb-3">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-white/30 bg-dark-glass backdrop-blur-md shadow-md overflow-hidden mr-3"
            whileHover={{ scale: 1.1 }}
          >
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/20">
                <span className="text-white text-lg font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </motion.div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold truncate">{username}</span>
            <span className="text-neon-pink/80 text-xs opacity-80">
              {new Date(post.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
        <motion.div
          className="mx-4 mb-3 rounded-xl overflow-hidden border border-white/10 bg-dark-glass backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full aspect-square object-cover"
          />
        </motion.div>
        {post.content && (
          <div className="px-5 pb-2">
            <motion.div
              className="bg-dark-glass backdrop-blur-lg text-white text-sm px-4 py-2 rounded-xl border border-neon-pink/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="leading-relaxed font-medium">{post.content}</p>
            </motion.div>
          </div>
        )}
        <div className="flex items-center justify-between px-5 pb-5 pt-3 text-white text-sm">
          <div className="flex items-center gap-5">
            <motion.div className="flex items-center gap-1" whileHover={{ scale: 1.1 }}>
              <span className="text-lg">💖</span>
              <span className="font-semibold">{post.like_count ?? 0}</span>
            </motion.div>
            <motion.div className="flex items-center gap-1" whileHover={{ scale: 1.1 }}>
              <span className="text-lg">💬</span>
              <span className="font-semibold">{post.comment_count ?? 0}</span>
            </motion.div>
          </div>
          <div className="text-white/60 text-xs">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};