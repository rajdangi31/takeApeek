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
      <div className="text-center text-pink-600 mt-10">Loading Peek...</div>
    );

  if (error)
    return (
      <div className="text-center text-red-500 mt-10">
        Error: {error.message}
      </div>
    );

  const username = data?.user_email?.split("@")[0] || "anonymous";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff0b8] to-white px-4 py-10 space-y-12">
      {/* Post Card */}
      <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] max-w-md w-full mx-auto px-6 py-10 text-center relative">
        {/* Avatar */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
            <img
              src={data?.avatar_url || "/avatar-placeholder.png"}
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Username */}
        <h2 className="text-lg font-extrabold text-black mt-16 drop-shadow-sm">
          {username}
        </h2>

        {/* Post Image */}
        <div className="rounded-xl overflow-hidden shadow-md my-6">
          <img
            src={data?.image_url}
            alt={data?.title}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 italic mb-4 px-2 leading-snug">
          {data?.content}
        </p>

        {/* Posted Date */}
        <p className="text-xs text-gray-500 italic font-medium mb-3">
          Posted on{" "}
          {new Date(data!.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>

        {/* Love Button */}
        <LikeButton postId={postId} />
      </div>

      {/* Comment Section */}
      <div className="max-w-md w-full mx-auto">
        <CommentSection postId={postId} />
      </div>
    </div>
  );
};
