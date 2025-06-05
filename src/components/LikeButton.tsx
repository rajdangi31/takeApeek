import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  postId: number;
}

interface Love {
  id: number;
  post_id: number;
  user_id: string;
  loves: number;
}

const loves = async (lovesValue: number, postId: number, userId: string) => {
  const { data: existingLove } = await supabase
    .from('loves')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingLove) {
    if (existingLove.loves === lovesValue) {
      const { error } = await supabase
        .from('loves')
        .delete()
        .eq('id', existingLove.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('loves')
        .update({ loves: lovesValue })
        .eq('id', existingLove.id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from('loves')
      .insert({ post_id: postId, user_id: userId, loves: lovesValue });
    if (error) throw new Error(error.message);
  }
};

const fetchLoves = async (postId: number): Promise<Love[]> => {
  const { data, error } = await supabase
    .from('loves')
    .select('*')
    .eq('post_id', postId);
  if (error) throw new Error(error.message);
  return data as Love[];
};

export const LikeButton = ({ postId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: Loves, isLoading, error } = useQuery<Love[], Error>({
    queryKey: ['loves', postId],
    queryFn: () => fetchLoves(postId),
    refetchInterval: 5000,
  });

  const { mutate } = useMutation({
    mutationFn: (lovesValue: number) => {
      if (!user) throw new Error('You must be logged in to Love!');
      return loves(lovesValue, postId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loves', postId] });
    },
  });

  if (isLoading)
    return <div className="text-neon-pink text-sm">Loading loves...</div>;
  if (error)
    return <div className="text-red-400 text-sm">Error: {error.message}</div>;

  const likes = Loves?.filter((v) => v.loves === 1).length || 0;
  const hasLoved = Loves?.some((v) => v.user_id === user?.id && v.loves === 1);

  return (
    <motion.div
      className="text-center mt-4"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        onClick={() => mutate(1)}
        className={`text-2xl transition-all duration-300 transform focus:outline-none ${
          hasLoved ? 'text-neon-pink scale-110' : 'text-gray-400 hover:text-neon-pink'
        }`}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      >
        {hasLoved ? '🖤' : '🤍'}{' '}
        <span className="ml-1 text-base text-neon-pink/80">{likes}</span>
      </motion.button>
    </motion.div>
  );
};