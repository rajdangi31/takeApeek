import { Link } from "react-router-dom";
import type { Peeks } from "./PostList";

interface Props {
  post: Peeks;
}

export const PostItem = ({ post }: Props) => {
  const username = post.user_email?.split("@")[0] || "anonymous";

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl shadow-[0_15px_35px_rgba(236,72,153,0.3)] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(236,72,153,0.4)]">
      <Link to={`/post/${post.id}`}>
        {/* Header with Avatar + Username */}
        <div className="flex items-center px-5 pt-5 pb-2">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg overflow-hidden mr-3 flex-shrink-0">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="font-bold text-white text-base drop-shadow-sm truncate">
              {username}
            </span>
            <span className="text-pink-100 text-xs opacity-80">
              {new Date(post.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Post Image */}
        <div className="rounded-2xl overflow-hidden mx-4 mb-4 shadow-[0_8px_25px_rgba(0,0,0,0.2)] bg-white/10 backdrop-blur-sm">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full aspect-square object-cover"
          />
        </div>

        {/* Caption */}
        {post.content && (
          <div className="px-5 pb-2">
            <div className="bg-black/20 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl border border-white/10">
              <p className="font-medium leading-relaxed">{post.content}</p>
            </div>
          </div>
        )}

        {/* Engagement Metrics */}
        <div className="flex items-center justify-between px-5 pb-5 pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-white">
              <span className="text-lg">💖</span>
              <span className="text-sm font-semibold">{post.like_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <span className="text-lg">💬</span>
              <span className="text-sm font-semibold">{post.comment_count ?? 0}</span>
            </div>
          </div>
          <div className="text-white/70 text-xs">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
      </Link>
    </div>
  );
};