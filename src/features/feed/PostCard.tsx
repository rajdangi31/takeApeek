import { Link } from "react-router-dom";
import type { FeedPost } from "../../types/database";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Repeat, Loader2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useRepeekPost } from "../../hooks/usePost";

interface Props {
  post: FeedPost;
}

export const PostCard = ({ post }: Props) => {
  const { user } = useAuth();
  const repeekMutation = useRepeekPost();
  
  const isRepeek = !!post.original_post_id;
  const authorName = post.user_display_name || post.user_username || "Anonymous";
  const originalAuthorName = post.original_author_display_name || post.original_author_username || "Original Creator";

  const handleRepeek = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    repeekMutation.mutate({ 
      userId: user.id, 
      originalPost: post 
    });
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="max-w-md mx-auto relative group mb-8"
    >
      {/* Repeek Header */}
      {isRepeek && (
        <div className="flex items-center gap-2 px-6 mb-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            <Repeat size={14} className="text-pink-500" />
            <span>Shared by {authorName}</span>
        </div>
      )}

      {/* Glow Effect Backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[2.5rem] blur opacity-5 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative glass-effect rounded-[2.5rem] overflow-hidden border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        <Link to={`/post/${post.id}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-50 to-purple-50 p-0.5 shadow-inner">
                {post.user_avatar ? (
                  <img
                    src={post.user_avatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover rounded-[0.9rem]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white rounded-[0.9rem] text-pink-500 font-extrabold font-outfit text-lg">
                    {(isRepeek ? originalAuthorName : authorName).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-outfit font-bold text-slate-800 text-base tracking-tight truncate leading-tight">
                  {isRepeek ? originalAuthorName : authorName}
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {new Date(post.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Post Content Wrapper */}
          <div className="px-3">
             {/* Post Image */}
            {post.image_url && (
              <div className="rounded-[1.8rem] overflow-hidden shadow-sm bg-slate-50 relative group-hover:shadow-md transition-shadow">
                <img
                  src={post.image_url}
                  alt="Post attachment"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Caption */}
            {post.content && (
              <div className={`${post.image_url ? "mt-4" : "mt-2"} px-3 pb-2`}>
                <p className="text-slate-700 text-[15px] leading-relaxed font-medium">
                  {post.content}
                </p>
              </div>
            )}
          </div>

          {/* Engagement Metrics */}
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 group/stat">
                <div className={`p-2 rounded-xl transition-colors ${post.is_liked_by_user ? 'bg-pink-50 text-pink-500' : 'bg-slate-50 text-slate-400 group-hover/stat:bg-pink-50 group-hover/stat:text-pink-400'}`}>
                   <Heart size={18} fill={post.is_liked_by_user ? "currentColor" : "none"} className={post.is_liked_by_user ? "animate-pulse" : ""} />
                </div>
                <span className={`text-sm font-bold font-outfit ${post.is_liked_by_user ? 'text-pink-500' : 'text-slate-500'}`}>
                   {post.like_count ?? 0}
                </span>
              </div>

              <div className="flex items-center gap-2 group/stat">
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover/stat:bg-blue-50 group-hover/stat:text-blue-400 transition-colors">
                   <MessageCircle size={18} />
                </div>
                <span className="text-sm font-bold text-slate-500 font-outfit">
                  {post.comment_count ?? 0}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 group/stat">
                <button 
                  onClick={handleRepeek}
                  disabled={repeekMutation.isPending}
                  className={`p-2 rounded-xl transition-all ${repeekMutation.isPending ? 'bg-purple-100 text-purple-600' : 'bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-500'}`}
                >
                    {repeekMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                </button>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover/stat:text-purple-400 transition-colors">
                    {post.share_count ?? 0}
                </span>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};