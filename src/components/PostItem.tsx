import { Link } from "react-router-dom";
import type { Peeks } from "./PostList";

interface Props {
  post: Peeks;
}

export const PostItem = ({ post }: Props) => {
  const username = post.user_email?.split("@")[0] || "anonymous";

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-pink-600 via-pink-500 to-fuchsia-600 rounded-3xl shadow-[0_0_40px_rgba(236,72,153,0.4)] overflow-hidden hover:scale-[1.015] hover:shadow-[0_0_60px_rgba(236,72,153,0.6)] transition-transform duration-300">
      <Link to={`/post/${post.id}`}>
        {/* Header */}
        <div className="flex items-center px-5 pt-5 pb-3">
          <div className="w-12 h-12 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md shadow-md overflow-hidden mr-3">
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
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold truncate">
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

        {/* Image */}
        <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full aspect-square object-cover"
          />
        </div>

        {/* Caption */}
        {post.content && (
          <div className="px-5 pb-2">
            <div className="bg-black/30 backdrop-blur-lg text-white text-sm px-4 py-2 rounded-xl border border-white/10">
              <p className="leading-relaxed font-medium">{post.content}</p>
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center justify-between px-5 pb-5 pt-3 text-white text-sm">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1">
              <span className="text-lg">💖</span>
              <span className="font-semibold">{post.like_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">💬</span>
              <span className="font-semibold">{post.comment_count ?? 0}</span>
            </div>
          </div>
          <div className="text-white/60 text-xs">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
      </Link>
    </div>
  );
};
