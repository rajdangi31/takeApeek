import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import type { Peeks } from './PostList';
import { supabase } from '../supabase-client';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';

interface Props {
  postId: number;
}

const fetchPostById = async (id: number): Promise<Peeks> => {
  const { data, error } = await supabase
    .from('Peeks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Peeks;
};

export const PostDetail = ({ postId }: Props) => {
  const { data, error, isLoading } = useQuery<Peeks, Error>({
    queryKey: ['peek', postId],
    queryFn: () => fetchPostById(postId),
  });

  const username = data?.user_email?.split('@')[0] || 'anonymous';

  if (isLoading)
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-dark-glass backdrop-blur-md rounded-3xl border border-neon-pink/40 p-8 shadow-glow"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="text-6xl">👀</div>
          <p className="text-neon-pink mt-2 font-semibold">Loading Peek...</p>
        </motion.div>
      </motion.div>
    );

  if (error)
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-dark-glass backdrop-blur-md rounded-3xl border border-red-500/40 p-8 shadow-glow">
          <div className="text-6xl mb-2">😞</div>
          <p className="text-red-400 font-semibold">Error: {error.message}</p>
        </div>
      </motion.div>
    );

  return (
    <motion.div
      className="min-h-screen py-10 px-4 space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="max-w-lg mx-auto bg-dark-glass border border-neon-pink/30 shadow-glow backdrop-blur-xl rounded-3xl overflow-hidden"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-neon-pink via-neon-purple to-blue-500 px-6 py-10 text-center relative">
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            whileHover={{ scale: 1.1 }}
          >
            <div className="w-20 h-20 rounded-full border-4 border-black shadow-xl overflow-hidden">
              {data?.avatar_url ? (
                <img
                  src={data.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white text-2xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </motion.div>
          <h2 className="text-white text-xl font-bold mt-4 drop-shadow">
            @{username}
          </h2>
        </div>
        <div className="pt-16 px-6 pb-8 space-y-6">
          <motion.div
            className="rounded-2xl overflow-hidden shadow-lg border border-neon-pink/20"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={data?.image_url}
              alt={data?.title}
              className="w-full object-cover aspect-square"
            />
          </motion.div>
          {data?.content && (
            <motion.div
              className="text-sm text-neon-pink/80 bg-dark-glass border border-neon-pink/30 px-4 py-3 rounded-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {data.content}
            </motion.div>
          )}
          <motion.div
            className="text-center text-xs text-neon-pink/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Peeked on{' '}
            {new Date(data!.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </motion.div>
          <div className="text-center">
            <LikeButton postId={postId} />
          </div>
        </div>
      </motion.div>
      <div className="max-w-lg mx-auto">
        <CommentSection postId={postId} />
      </div>
    </motion.div>
  );
};