import { Link } from "react-router-dom";
import type { Peeks } from "./PostList";

interface Props {
  post: Peeks;
}

export const PostItem = ({ post }: Props) => {
  const username = post.user_email?.split("@")[0] || "anonymous";

  return (
    <div className="max-w-md mx-auto bg-pink-500 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] overflow-hidden my-8 text-white transition-transform transform hover:scale-[1.015]">
      <Link to={`/post/${post.id}`}>
        {/* Header: Avatar + Username */}
        <div className="flex items-center px-5 pt-5">
          <div className="w-12 h-12 rounded-full bg-white border-[3px] border-pink-100 shadow-lg overflow-hidden mr-4">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[15px] text-black drop-shadow-sm">
              {username}
            </span>
            <span className="text-pink-100 text-xs -mt-0.5">@{username}</span>
          </div>
        </div>

        {/* Time */}
        <div className="text-center text-xs font-medium text-white py-2 drop-shadow-sm">
          {new Date(post.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {/* Post Image */}
        <div className="rounded-xl mx-5 overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.25)] h-64 mt-1">
          <img
            src={post.image_url}
            alt={username}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Optional Caption */}
        {post.content && (
          <div className="bg-black/40 text-white text-xs px-4 py-2 mt-3 mx-5 rounded-xl font-light italic backdrop-blur-sm shadow-sm">
            {post.content}
          </div>
        )}

        {/* Metrics: Likes + Comments */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 text-sm font-medium text-white">
          <div className="flex items-center gap-1">
            <span>🖤</span>
            <span>{post.like_count ?? 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💬</span>
            <span>{post.comment_count ?? 0}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};
