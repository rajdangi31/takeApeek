import { useAuth } from "../auth/AuthContext";
import { useToggleLike, useIsLiked } from "../../hooks/usePost";
import { usePostDetail } from "../../hooks/usePost";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface Props {
  postId: string;
}

export const LikeButton = ({ postId }: Props) => {
  const { user } = useAuth();
  const { data: post } = usePostDetail(postId);
  const { data: isLiked, isLoading } = useIsLiked(postId, user?.id);
  const { mutate, isPending } = useToggleLike();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to like posts.");
      return;
    }
    mutate({ userId: user.id, postId, isLiked: !!isLiked });
  };

  if (isLoading) return <div className="animate-pulse w-8 h-8 rounded-full bg-slate-100" />;

  return (
    <div className="text-center flex items-center justify-center">
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={handleToggle}
        disabled={isPending}
        className={`group relative flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all duration-300
          ${isLiked 
            ? "bg-pink-50 text-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.15)]" 
            : "bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-400"}
          ${isPending ? "opacity-70 cursor-not-allowed" : ""}
        `}
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {isLiked ? (
              <motion.div
                key="liked"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Heart size={20} fill="currentColor" strokeWidth={2.5} className="drop-shadow-sm" />
              </motion.div>
            ) : (
              <motion.div
                key="unliked"
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
              >
                <Heart size={20} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pop Particles Effect (Simplified) */}
          {isLiked && !isPending && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 bg-pink-400 rounded-full blur-[2px]"
            />
          )}
        </div>
        
        <span className="text-base font-bold font-outfit tracking-tight">
          {post?.like_count ?? 0}
        </span>

        {isLiked && (
            <motion.span 
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: -20, opacity: [0, 1, 0] }}
                className="absolute left-1/2 -translate-x-1/2 font-bold pointer-events-none"
            >
                +1
            </motion.span>
        )}
      </motion.button>
    </div>
  );
};
