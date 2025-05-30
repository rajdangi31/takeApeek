import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { useAuth } from "../contexts/AuthContext";

export interface Peeks {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  user_email: string;
  avatar_url?: string;
  like_count?: number;
  comment_count: number;
}

const fetchBestiesPosts = async (userId: string): Promise<Peeks[]> => {
  // First, get all accepted besties
  const { data: besties, error: bestiesError } = await supabase
    .from("besties")
    .select("user_id, bestie_id")
    .eq("status", "accepted")
    .or(`user_id.eq.${userId},bestie_id.eq.${userId}`);

  if (bestiesError) throw new Error(bestiesError.message);

  // Extract bestie user IDs (excluding current user)
  const bestieIds = new Set<string>();
  besties?.forEach(bestie => {
    if (bestie.user_id === userId) {
      bestieIds.add(bestie.bestie_id);
    } else {
      bestieIds.add(bestie.user_id);
    }
  });

  // Always include current user's posts
  bestieIds.add(userId);

  if (bestieIds.size === 0) {
    return []; // No besties, return empty array
  }

  // Get user emails for these user IDs
  const { data: userProfiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email")
    .in("id", Array.from(bestieIds));

  if (profileError) throw new Error(profileError.message);

  const bestieEmails = userProfiles?.map(profile => profile.email) || [];

  if (bestieEmails.length === 0) {
    return [];
  }

  // Now get posts from these users
  const { data, error } = await supabase.rpc("get_posts_with_counts");

  if (error) throw new Error(error.message);

  // Filter posts to only include those from besties
  const allPosts = data as Peeks[];
  return allPosts.filter(post => bestieEmails.includes(post.user_email));
};

export const PostList = () => {
  const { user } = useAuth();

  const { data, error, isLoading } = useQuery<Peeks[], Error>({
    queryKey: ["peeks", "besties", user?.id],
    queryFn: () => {
      if (!user) return [];
      return fetchBestiesPosts(user.id);
    },
    enabled: !!user, // Only run query if user is logged in
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-pink-100">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sign in to peek!</h3>
          <p className="text-gray-600 text-sm">
            Please sign in to see peeks from your besties.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-pink-100">
          <div className="animate-pulse">
            <div className="text-6xl mb-4">👀</div>
            <h3 className="text-xl font-bold text-gray-800">Loading Peeks...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-red-100">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Oops!</h3>
          <p className="text-red-500 text-sm">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-pink-100">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No peeks yet!</h3>
          <p className="text-gray-600 text-sm">
            No peeks from your besties yet. Add some friends to see their posts!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((post, key) => (
        <PostItem post={post} key={key} />
      ))}
    </div>
  );
};