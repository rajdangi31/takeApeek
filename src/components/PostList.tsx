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
  const { data: besties, error: bestiesError } = await supabase
    .from("besties")
    .select("user_id, bestie_id")
    .eq("status", "accepted")
    .or(`user_id.eq.${userId},bestie_id.eq.${userId}`);

  if (bestiesError) throw new Error(bestiesError.message);

  const bestieIds = new Set<string>();
  besties?.forEach((bestie) => {
    if (bestie.user_id === userId) bestieIds.add(bestie.bestie_id);
    else bestieIds.add(bestie.user_id);
  });

  bestieIds.add(userId);

  const { data: userProfiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email")
    .in("id", Array.from(bestieIds));

  if (profileError) throw new Error(profileError.message);

  const bestieEmails = userProfiles?.map((profile) => profile.email) || [];

  const { data, error } = await supabase.rpc("get_posts_with_counts");

  if (error) throw new Error(error.message);

  const allPosts = data as Peeks[];
  return allPosts.filter((post) => bestieEmails.includes(post.user_email));
};

export const PostList = () => {
  const { user } = useAuth();

  const { data, error, isLoading } = useQuery<Peeks[], Error>({
    queryKey: ["peeks", "besties", user?.id],
    queryFn: () => {
      if (!user) return [];
      return fetchBestiesPosts(user.id);
    },
    enabled: !!user,
  });

  const MessageCard = ({
    emoji,
    title,
    description,
    color = "pink",
  }: {
    emoji: string;
    title: string;
    description: string;
    color?: "pink" | "red";
  }) => (
    <div
      className={`bg-gradient-to-br from-${color}-900/30 to-${color}-700/20 text-white/90 backdrop-blur-xl border border-${color}-500/30 rounded-3xl max-w-md mx-auto p-8 shadow-xl`}
    >
      <div className="text-6xl mb-4 text-center">{emoji}</div>
      <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
      <p className="text-sm text-center text-white/70">{description}</p>
    </div>
  );

  if (!user) {
    return (
      <div className="py-12 text-center">
        <MessageCard
          emoji="🔐"
          title="Sign in to peek!"
          description="Please sign in to see peeks from your besties."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <MessageCard
          emoji="👀"
          title="Loading Peeks..."
          description="Fetching the latest peeks from your inner circle..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <MessageCard
          emoji="😞"
          title="Oops!"
          description={`Error: ${error.message}`}
          color="red"
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageCard
          emoji="📱"
          title="No peeks yet!"
          description="No peeks from your besties yet. Add some friends to see their posts!"
        />
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
