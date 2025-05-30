import { useQuery } from "@tanstack/react-query";
import type { Peeks } from "./PostList";
import { supabase } from "../supabase-client";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";

interface Props {
  postId: number;
}

const fetchPostById = async (id: number): Promise<Peeks> => {
  const { data, error } = await supabase
    .from("Peeks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Peeks;
};

export const PostDetail = ({ postId }: Props) => {
  const { data, error, isLoading } = useQuery<Peeks, Error>({
    queryKey: ["peek", postId],
    queryFn: () => fetchPostById(postId),
  });

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-pink-100">
          <div className="text-center">
            <div className="animate-pulse text-6xl mb-4">👀</div>
            <p className="text-pink-600 font-semibold">Loading Peek...</p>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-red-100 text-center">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-red-500 font-semibold">Error: {error.message}</p>
        </div>
      </div>
    );

  const username = data?.user_email?.split("@")[0] || "anonymous";

  return (
    <div className="min-h-screen py-8 space-y-8">
      {/* Main Post Card */}
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.1)] overflow-hidden border border-pink-100 relative">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-8 text-center relative">
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
              {data?.avatar_url ? (
                <img
                  src={data.avatar_url}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-white drop-shadow-sm">
            {username}
          </h2>
        </div>

        {/* Content Area */}
        <div className="pt-10 px-6 pb-6">
          {/* Post Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg mb-4 bg-gray-100">
            <img
              src={data?.image_url}
              alt={data?.title}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* Caption */}
          {data?.content && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed px-2 py-3 bg-pink-50 rounded-xl border border-pink-100">
                {data.content}
              </p>
            </div>
          )}

          {/* Post Metadata */}
          <div className="text-center text-xs text-gray-500 mb-4">
            Posted on{" "}
            {new Date(data!.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {/* Like Button */}
          <div className="text-center">
            <LikeButton postId={postId} />
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-md mx-auto">
        <CommentSection postId={postId} />
      </div>
    </div>
  );
};