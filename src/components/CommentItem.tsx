import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Comment } from './CommentSection';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  comment: Comment & {
    children?: Comment[];
  };
  postId: number;
}

const createReply = async (
  replyContent: string,
  postId: number,
  parentCommentId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) throw new Error('You must be logged in to reply.');

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message);
};

export const CommentItem = ({ comment, postId }: Props) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(
        replyContent,
        postId,
        comment.id,
        user?.id,
        user?.user_metadata?.user_name || user?.email
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setReplyText('');
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText) return;
    mutate(replyText);
  };

  return (
    <motion.div
      className="mt-6 border-l border-neon-pink/50 pl-4 max-w-full overflow-x-hidden"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-sm font-semibold text-neon-pink">{comment.author}</div>
      <div className="text-xs text-neon-pink/60 mb-1">
        {new Date(comment.created_at).toLocaleString()}
      </div>
      <motion.p
        className="text-sm text-gray-100 mb-2 bg-dark-glass p-3 rounded-xl border border-neon-pink/20"
        whileHover={{ scale: 1.01 }}
      >
        {comment.content}
      </motion.p>
      <motion.button
        onClick={() => setShowReply((prev) => !prev)}
        className="text-neon-pink text-xs font-semibold hover:underline"
        whileHover={{ scale: 1.1 }}
      >
        {showReply ? 'Cancel' : 'Reply'}
      </motion.button>
      {showReply && user && (
        <motion.form
          onSubmit={handleReplySubmit}
          className="mt-3 space-y-2"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Write a reply..."
            className="w-full p-2 bg-dark-glass border border-neon-pink/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-neon-pink/70"
          />
          <motion.button
            type="submit"
            disabled={!replyText || isPending}
            className="bg-gradient-to-r from-neon-pink to-neon-purple text-white px-4 py-1 text-sm rounded-full hover:from-neon-purple hover:to-neon-pink disabled:opacity-50 transition shadow-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPending ? 'Posting...' : 'Post Reply'}
          </motion.button>
          {isError && <p className="text-xs text-red-500">Error posting reply.</p>}
        </motion.form>
      )}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-3">
          <motion.button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center text-neon-pink text-xs font-semibold hover:underline"
            whileHover={{ scale: 1.05 }}
          >
            <span>{isCollapsed ? 'Show Replies' : 'Hide Replies'}</span>
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className={`ml-1 w-4 h-4 transform transition-transform duration-300 ${
                isCollapsed ? '' : 'rotate-180'
              }`}
              animate={{ rotate: isCollapsed ? 0 : 180 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
            </motion.svg>
          </motion.button>
          {!isCollapsed && (
            <motion.div
              className="mt-2 pl-3 border-l border-neon-pink/30 space-y-4 overflow-x-auto"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {comment.children.map((child, key) => (
                <CommentItem key={key} comment={child} postId={postId} />
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};