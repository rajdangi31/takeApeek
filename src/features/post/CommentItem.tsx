import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useAddComment } from "../../hooks/usePost";
import type { EnrichedComment } from "../../hooks/usePost";
import { motion, AnimatePresence } from "framer-motion";
import { Reply, ChevronDown, CornerDownRight, Send } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  comment: EnrichedComment & { children?: EnrichedComment[] };
  postId: string;
  depth?: number;
}

export const CommentItem = ({ comment, postId, depth = 0 }: Props) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(depth > 0); // Collapse nested replies by default

  const { user } = useAuth();
  const { mutate, isPending } = useAddComment();

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !user) return;
    
    mutate({ 
      userId: user.id, 
      postId, 
      content: replyText,
      parentId: comment.id
    }, {
      onSuccess: () => {
        setReplyText("");
        setShowReply(false);
        setIsCollapsed(false); 
      }
    });
  };

  const username = comment.profiles?.display_name || comment.profiles?.username || "Anonymous";
  const initials = username.charAt(0).toUpperCase();

  return (
    <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`relative ${depth > 0 ? 'ml-6 md:ml-10' : ''}`}
    >
      {/* Thread Line */}
      {depth > 0 && (
          <div className="absolute -left-6 md:-left-10 top-0 bottom-0 w-px bg-slate-100 opacity-50" />
      )}

      <div className="group relative">
        <div className="flex items-start gap-4">
            {/* Avatar */}
            <Link to={`/profile/${comment.user_id}`} className="shrink-0 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                    {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
                    ) : (
                        <span className="text-pink-500 font-black text-xs font-outfit">{initials}</span>
                    )}
                </div>
            </Link>

            {/* Comment Bubble */}
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Link to={`/profile/${comment.user_id}`} className="text-sm font-black font-outfit text-slate-900 hover:text-pink-600 transition-colors">
                        {username}
                    </Link>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                         {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-2xl rounded-tl-none border border-slate-100/50 shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {comment.content}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 px-1">
                    <button
                        onClick={() => setShowReply((prev) => !prev)}
                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${showReply ? 'text-pink-600' : 'text-slate-400 hover:text-pink-500'}`}
                    >
                        <Reply size={12} /> {showReply ? "Cancel" : "Reply"}
                    </button>

                    {comment.children && comment.children.length > 0 && (
                        <button
                            onClick={() => setIsCollapsed((prev) => !prev)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                        >
                            <ChevronDown size={12} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                            {isCollapsed ? `Peeks (${comment.children.length})` : "Fold"}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Reply Input */}
        <AnimatePresence>
            {showReply && user && (
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    onSubmit={handleReplySubmit} 
                    className="mt-4 ml-14 relative group/reply"
                >
                    <div className="absolute -left-4 top-0 bottom-0 w-px bg-pink-100 opacity-50" />
                    <textarea
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder={`Reply to ${username}...`}
                        className="w-full p-4 bg-white border border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/5 transition-all font-medium text-sm text-slate-700 shadow-xl shadow-pink-500/5"
                    />
                    <button
                        type="submit"
                        disabled={!replyText || isPending}
                        className="absolute bottom-3 right-3 bg-pink-500 text-white p-2 rounded-xl hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-pink-200"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                    </button>
                </motion.form>
            )}
        </AnimatePresence>
      </div>

      {/* Nested Replies */}
      <AnimatePresence initial={false}>
        {!isCollapsed && comment.children && comment.children.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-6 overflow-hidden"
            >
                {comment.children.map((child) => (
                    <CommentItem key={child.id} comment={child} postId={postId} depth={depth + 1} />
                ))}
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
