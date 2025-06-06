import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../contexts/AuthContext";

// ✨ CHANGED: Added postOwnerId to the props
interface Props {
  postId: number;
  postOwnerId: string; // The user ID of the person who created the post
}

interface Love {
  id: number;
  post_id: number;
  user_id: string;
  loves: number; // Assuming 1 is for 'love'
}

// Your existing 'loves' function is perfect, no changes needed here.
const loves = async (lovesValue: number, postId: number, userId: string) => {
  const { data: existingLove } = await supabase
    .from("loves")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLove) {
    if (existingLove.loves === lovesValue) {
      const { error } = await supabase
        .from("loves")
        .delete()
        .eq("id", existingLove.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("loves")
        .update({ loves: lovesValue })
        .eq("id", existingLove.id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("loves")
      .insert({ post_id: postId, user_id: userId, loves: lovesValue });
    if (error) throw new Error(error.message);
  }
};

const fetchLoves = async (postId: number): Promise<Love[]> => {
  const { data, error } = await supabase
    .from("loves")
    .select("*")
    .eq("post_id", postId);
  if (error) throw new Error(error.message);
  return data as Love[];
};

// ✨ CHANGED: Destructure postOwnerId from props
export const LikeButton = ({ postId, postOwnerId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: lovesData, // Renamed for clarity to avoid conflict with 'loves' function
    isLoading,
    error,
  } = useQuery<Love[], Error>({
    queryKey: ["loves", postId],
    queryFn: () => fetchLoves(postId),
  });

  const { mutate } = useMutation({
    // ✨ CHANGED: The mutation now accepts an object to know if it's a "like" or "unlike"
    mutationFn: (variables: { lovesValue: number; isLiking: boolean }) => {
      if (!user) throw new Error("You must be logged in to Love!");
      return loves(variables.lovesValue, postId, user.id);
    },
    // ✨ CHANGED: The onSuccess callback now handles the push notification
    onSuccess: (_, variables) => {
      // First, invalidate the query to update the UI immediately
      queryClient.invalidateQueries({ queryKey: ["loves", postId] });
      
      // Only send a notification if the action was a "like", not an "unlike"
      if (variables.isLiking && user) {
        // This is a "fire-and-forget" call. We don't need to wait for it.
        // We also wrap it in a try/catch so a failed push doesn't crash the app.
        try {
          console.log("Triggering push notification for a new like...");
          supabase.functions.invoke('trigger-bestie-push', {
            body: {
              actionType: 'LIKE',
              actor: {
                id: user.id,
                // Ensure you have a username in your user_metadata in Supabase Auth
                username: user.user_metadata?.username || 'Someone',
              },
              post: {
                id: postId,
                ownerId: postOwnerId,
              }
            }
          });
        } catch (pushError) {
          console.error("Failed to trigger push notification:", pushError);
        }
      }
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const likes = lovesData?.filter((v) => v.loves === 1).length || 0;
  const hasLoved = lovesData?.some((v) => v.user_id === user?.id && v.loves === 1);

  return (
    <div className="text-center mt-2">
      <button
        // ✨ CHANGED: Pass the new variables object to mutate
        onClick={() => mutate({ lovesValue: 1, isLiking: !hasLoved })}
        className={`text-2xl transition-transform duration-200 ${
          hasLoved
            ? "text-pink-600 scale-110"
            : "text-gray-400 hover:text-pink-500"
        }`}
        title={hasLoved ? "Unlike" : "Love this"}
      >
        {hasLoved ? "🖤" : "🤍"} <span className="ml-1 text-base">{likes}</span>
      </button>
    </div>
  );
};