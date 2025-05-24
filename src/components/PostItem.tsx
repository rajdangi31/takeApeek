import { Link } from "react-router-dom";
import type { Peeks } from "./PostList";

interface Props {
  post: Peeks;
}

export const PostItem = ({ post }: Props) => {
  const username = post.user_email?.split("@")[0] || "anonymous";

  return (
    <div className="max-w-md mx-auto bg-pink-500 rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] overflow-hidden my-8 text-white transition transform hover:scale-[1.01]">
      <Link to={`/post/${post.id}`}>
        {/* Header with Avatar and Username */}
        <div className="flex items-center px-5 pt-5">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-white border-[3px] border-pink-100 shadow-[0_4px_10px_rgba(0,0,0,0.25)] overflow-hidden mr-4">
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

          {/* Username */}
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-[15px] text-black drop-shadow-sm">{username}</span>
            <span className="text-pink-100 text-xs -mt-0.5">@{username}</span>
          </div>
        </div>

        {/* Time */}
        <div className="text-center text-xs font-semibold text-white py-2 drop-shadow-sm">
          {new Date(post.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {/* Image */}
        <div className="rounded-xl mx-5 overflow-hidden shadow-[0_6px_15px_rgba(0,0,0,0.25)] h-64">
          <img
            src={post.image_url}
            alt={username}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Caption Bar */}
        {post.content && (
          <div className="bg-black/40 text-white text-xs px-4 py-2 mt-3 mx-5 rounded-xl font-light italic backdrop-blur-sm drop-shadow-sm">
            {post.content}
          </div>
        )}

        <div className="h-4" />
      </Link>
    </div>
  );
};
