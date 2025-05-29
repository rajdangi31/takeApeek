import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { data } from "react-router";

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

const fetchPosts = async (): Promise<Peeks[]> => {
  const { data, error } = await supabase.rpc("get_posts_with_counts")
    

  if (error) throw new Error(error.message);
  return data as Peeks[];

};

console.log(data);

export const PostList = () => {
  const { data, error, isLoading } = useQuery<Peeks[], Error>({
    queryKey: ["peeks"],
    queryFn: fetchPosts,
  });

  if (isLoading) return <div>Loading Peeks...</div>;

  if (error) return <div>Error:/4\ {error.message}</div>;

  return (
    <div>
      {data?.map((post, key) => (
        <PostItem post={post} key={key} />
      ))}
    </div>
  );
};
