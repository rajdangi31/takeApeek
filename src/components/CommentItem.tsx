import { useState } from "react";
import type { Comment } from "./CommentSection";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabase-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  comment: Comment & {
    children?: Comment[];
  };
  postId: number;
}

const createReply = async (
  replyContent: string,
  postId: number,
  parentCommentId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) throw new Error("You must be logged in to reply.");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message);
};

export const CommentItem = ({ comment, postId }: Props) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(
        replyContent,
        postId,
        comment.id,
        user?.id,
        user?.user_metadata?.user_name || user?.email
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setReplyText("");
      setShowReply(false);
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText) return;
    mutate(replyText);
  };

  return (
    <div className="mt-6 border-l border-pink-500/50 pl-4 max-w-full overflow-x-hidden">
      <div className="text-sm font-semibold text-pink-300">{comment.author}</div>
      <div className="text-xs text-pink-500/60 mb-1">
        {new Date(comment.created_at).toLocaleString()}
      </div>
      <p className="text-sm text-gray-100 mb-2 bg-zinc-800 p-3 rounded-xl border border-pink-500/20">
        {comment.content}
      </p>

      <button
        onClick={() => setShowReply((prev) => !prev)}
        className="text-pink-400 text-xs font-semibold hover:underline"
      >
        {showReply ? "Cancel" : "Reply"}
      </button>

      {showReply && user && (
        <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Write a reply..."
            className="w-full p-2 bg-zinc-900 border border-pink-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500/70"
          />
          <button
            type="submit"
            disabled={!replyText || isPending}
            className="bg-pink-500 text-white px-4 py-1 text-sm rounded-full hover:bg-pink-600 disabled:opacity-50 transition"
          >
            {isPending ? "Posting..." : "Post Reply"}
          </button>
          {isError && <p className="text-xs text-red-500">Error posting reply.</p>}
        </form>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center text-pink-400 text-xs font-semibold hover:underline"
          >
            <span>{isCollapsed ? "Show Replies" : "Hide Replies"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className={`ml-1 w-4 h-4 transform transition-transform duration-300 ${
                isCollapsed ? "" : "rotate-180"
              }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {!isCollapsed && (
            <div className="mt-2 pl-3 border-l border-pink-500/30 space-y-4 overflow-x-auto">
              {comment.children.map((child, key) => (
                <CommentItem key={key} comment={child} postId={postId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
