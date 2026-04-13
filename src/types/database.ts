export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  is_private: boolean;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
};

export type Like = {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

// RPC Output Type
export type FeedPost = {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  user_id: string;
  user_username: string | null;
  user_display_name: string | null;
  user_avatar: string | null;
  is_liked_by_user: boolean;
  original_post_id?: string | null;
  original_author_username?: string | null;
  original_author_display_name?: string | null;
};
