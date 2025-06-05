import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase-client';
import { CommentItem } from './CommentItem';

interface Props {
  postId: number;
}

interface NewComment {
  content: string;
  parent_comment_id?: number | null;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  content: string;
  user_id: string;
  created_at: string;
  author: string;
}

const createComment = async (
  newComment: NewComment,
  postId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) {
    throw new Error('You must be logged in to comment.');
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message);
};

const fetchComments = async (postId: number): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Comment[];
};

export const CommentSection = ({ postId }: Props) => {
  const [newCommentText, setNewCommentText] = useState<string>('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery<Comment[], Error>({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    refetchInterval: 5000,
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (newComment: NewComment) =>
      createComment(
        newComment,
        postId,
        user?.id,
        user?.user_metadata?.user_name || user?.email
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText) return;
    mutate({ content: newCommentText, parent_comment_id: null });
    setNewCommentText('');
  };

  const buildCommentTree = (
    flatComments: Comment[]
  ): (Comment & { children?: Comment[] })[] => {
    const map = new Map<number, Comment & { children?: Comment[] }>();
    const roots: (Comment & { children?: Comment[] })[] = [];

    flatComments.forEach((comment) => {
      map.set(comment.id, { ...comment, children: [] });
    });

    flatComments.forEach((comment) => {
      if (comment.parent_comment_id) {
        const parent = map.get(comment.parent_comment_id);
        if (parent) {
          parent.children!.push(map.get(comment.id)!);
        }
      } else {
        roots.push(map.get(comment.id)!);
      }
    });

    return roots;
  };

  if (isLoading) {
    return <div className="text-center text-neon-pink">Loading Comments...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  const commentTree = comments ? buildCommentTree(comments) : [];

  return (
    <motion.div
      className="max-w-2xl mx-auto mt-10 bg-dark-glass border border-neon-pink/30 rounded-2xl p-6 shadow-glow text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold text-neon-pink mb-6">Comments</h3>
      {user ? (
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <textarea
            value={newCommentText}
            rows={3}
            placeholder="Write a comment..."
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full p-3 border border-neon-pink/50 rounded-lg bg-dark-glass text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-pink"
          />
          <motion.button
            type="submit"
            disabled={!newCommentText || isPending}
            className="bg-gradient-to-r from-neon-pink to-neon-purple text-white font-semibold px-5 py-2 rounded-full hover:from-neon-purple hover:to-neon-pink transition disabled:opacity-50 shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPending ? 'Posting...' : 'Post Comment'}
          </motion.button>
          {isError && (
            <p className="text-sm text-red-500 mt-1">Error posting comment.</p>
          )}
        </motion.form>
      ) : (
        <p className="text-sm text-gray-400 italic">
          You must be logged in to post a comment.
        </p>
      )}
      <motion.div
        className="mt-8 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {commentTree.map((comment, key) => (
          <CommentItem key={key} comment={comment} postId={postId} />
        ))}
      </motion.div>
    </motion.div>
  );
};