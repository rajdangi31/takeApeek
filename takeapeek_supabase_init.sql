-- ==========================================
-- TAKE-A-PEEK SUPABASE CORE SCHEMA INITIALIZATION
-- ==========================================

-- -----------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  is_private boolean default false,
  push_subscription jsonb,
  push_enabled boolean default false,
  created_at timestamptz default now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------
-- 2. POSTS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  content text not null,
  image_url text,
  like_count int default 0,
  comment_count int default 0,
  share_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Post RLS: Users can read posts from public accounts or active friends
CREATE POLICY "Read posts from friends or public accounts" ON posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = posts.user_id AND is_private = false) OR
  auth.uid() = posts.user_id OR
  EXISTS (
    SELECT 1 FROM friendships 
    WHERE status = 'accepted' AND (
      (requester_id = auth.uid() AND addressee_id = posts.user_id) OR
      (addressee_id = auth.uid() AND requester_id = posts.user_id)
    )
  )
);

CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 3. FRIENDSHIPS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) not null,
  addressee_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friendships RLS
CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests" ON friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressees or requesters can update friendship status" ON friendships FOR UPDATE 
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Users can delete their friendships" ON friendships FOR DELETE 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- -----------------------------------------------------
-- 4. COMMENTS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  like_count int default 0,
  created_at timestamptz default now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comments on readable posts" ON comments FOR SELECT USING (
  -- Falls back on the posts SELECT policy implicitly through the post reference, mapped cleanly below:
  EXISTS(SELECT 1 FROM posts WHERE id = comments.post_id)
);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 5. LIKES (Polymorphic)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now(),
  check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  unique nulls not distinct (user_id, post_id),
  unique nulls not distinct (user_id, comment_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View likes on readable items" ON likes FOR SELECT USING (
  (post_id IS NOT NULL AND EXISTS(SELECT 1 FROM posts WHERE id = likes.post_id)) OR
  (comment_id IS NOT NULL AND EXISTS(SELECT 1 FROM comments WHERE id = likes.comment_id))
);
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 6. NOTIFICATIONS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) not null,
  actor_id uuid references public.profiles(id) not null,
  type text check (type in ('like', 'comment', 'reply', 'friend_request', 'friend_accept', 'mention', 'share')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- -----------------------------------------------------
-- 7. DENORMALIZATION TRIGGERS
-- -----------------------------------------------------

-- A. Post Likes Cache
CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_post_like_count_trigger
AFTER INSERT OR DELETE ON likes FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();

-- B. Post Comment Cache
CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_post_comment_count_trigger
AFTER INSERT OR DELETE ON comments FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- C. Comment Likes Cache
CREATE OR REPLACE FUNCTION update_comment_like_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_comment_like_count_trigger
AFTER INSERT OR DELETE ON likes FOR EACH ROW
EXECUTE FUNCTION update_comment_like_count();

-- -----------------------------------------------------
-- 8. RPC FEED FUNCTION (PREVENTS N+1)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_friend_feed(requesting_user_id uuid, page_limit int, page_offset int)
RETURNS TABLE (
  id uuid,
  content text,
  image_url text,
  like_count int,
  comment_count int,
  share_count int,
  created_at timestamptz,
  user_id uuid,
  user_username text,
  user_display_name text,
  user_avatar text,
  is_liked_by_user boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.content, p.image_url, p.like_count, p.comment_count, p.share_count, p.created_at,
    pr.id AS user_id, pr.username AS user_username, pr.display_name AS user_display_name, pr.avatar_url AS user_avatar,
    EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = requesting_user_id) AS is_liked_by_user
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE 
    p.user_id = requesting_user_id -- User's own posts
    OR EXISTS (
      -- Or posts from friends
      SELECT 1 FROM friendships f 
      WHERE f.status = 'accepted' AND (
        (f.requester_id = requesting_user_id AND f.addressee_id = p.user_id) OR
        (f.addressee_id = requesting_user_id AND f.requester_id = p.user_id)
      )
    )
    OR pr.is_private = false -- Or public posts (optional depending on product requirements)
  ORDER BY p.created_at DESC
  LIMIT page_limit OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
