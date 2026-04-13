import { usePostDetail } from "../../hooks/usePost";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { motion } from "framer-motion";
import { PostSkeleton } from "../../components/ui/Skeleton";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  postId: string;
}

export const PostDetail = ({ postId }: Props) => {
  const { data, error, isLoading } = usePostDetail(postId);

  if (isLoading)
    return (
      <div className="py-10">
        <PostSkeleton />
      </div>
    );

  if (error || !data)
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[50vh] flex items-center justify-center"
      >
        <div className="glass-effect rounded-[2.5rem] p-10 border-red-100 text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">😞</div>
          <h3 className="text-2xl font-bold text-red-600 mb-2 font-outfit">Post Not Found</h3>
          <p className="text-red-500/80 font-medium">This peek might have been removed or moved.</p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
             <ArrowLeft size={18} /> Back to Feed
          </Link>
        </div>
      </motion.div>
    );

  const username = data.profiles?.display_name || data.profiles?.username || "Anonymous";

  return (
    <div className="py-6 space-y-10">
       <div className="max-w-md mx-auto flex items-center justify-between px-2">
            <Link to="/" className="p-3 glass-effect rounded-2xl text-slate-600 hover:text-pink-600 transition-colors shadow-sm">
                 <ArrowLeft size={20} />
            </Link>
            <span className="font-outfit font-extrabold text-slate-800 tracking-tight text-xl">Peek Detail</span>
            <div className="w-12 h-12" /> {/* Spacer */}
       </div>

      {/* Main Post Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto glass-effect rounded-[2.5rem] overflow-hidden border-white/60 shadow-2xl relative"
      >
        {/* Header Section */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center">
            <div className="relative mb-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 p-1 shadow-xl rotate-3">
                    <div className="w-full h-full bg-white rounded-[1.2rem] overflow-hidden">
                    {data.profiles?.avatar_url ? (
                        <img
                        src={data.profiles.avatar_url}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <span className="text-pink-500 text-2xl font-black font-outfit">
                            {username.charAt(0).toUpperCase()}
                        </span>
                        </div>
                    )}
                    </div>
                </div>
            </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-outfit tracking-tight">
            {username}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(data.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-5 pb-8 space-y-6">
          {/* Post Image */}
          {data.image_url && (
            <div className="rounded-[2.2rem] overflow-hidden shadow-md bg-slate-50">
              <img
                src={data.image_url}
                alt="Post"
                className="w-full aspect-square object-cover"
              />
            </div>
          )}

          {/* Caption */}
          {data.content && (
            <div className="px-3">
              <p className="text-slate-700 text-lg leading-relaxed font-medium">
                {data.content}
              </p>
            </div>
          )}

          {/* Engagement Section */}
          <div className="pt-4 flex flex-col items-center">
            <LikeButton postId={postId} />
          </div>
        </div>
      </motion.div>

      {/* Comments Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-md mx-auto"
      >
        <CommentSection postId={postId} />
      </motion.div>
    </div>
  );
};