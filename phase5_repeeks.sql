-- =====================================================
-- PHASE 5: RE-PEEKS (RE-POSTS)
-- =====================================================

-- 1. Add original_post_id to support re-peeking
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS original_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- 2. Update the FEED RPC to return re-peek metadata
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
  is_liked_by_user boolean,
  original_post_id uuid,
  original_author_username text,
  original_author_display_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.content, p.image_url, p.like_count, p.comment_count, p.share_count, p.created_at,
    pr.id AS user_id, pr.username AS user_username, pr.display_name AS user_display_name, pr.avatar_url AS user_avatar,
    EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = requesting_user_id) AS is_liked_by_user,
    p.original_post_id,
    orig_pr.username AS original_author_username,
    orig_pr.display_name AS original_author_display_name
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  LEFT JOIN posts orig_p ON orig_p.id = p.original_post_id
  LEFT JOIN profiles orig_pr ON orig_pr.id = orig_p.user_id
  WHERE 
    p.user_id = requesting_user_id 
    OR EXISTS (
      SELECT 1 FROM friendships f 
      WHERE f.status = 'accepted' AND (
        (f.requester_id = requesting_user_id AND f.addressee_id = p.user_id) OR
        (f.addressee_id = requesting_user_id AND f.requester_id = p.user_id)
      )
    )
    OR pr.is_private = false 
  ORDER BY p.created_at DESC
  LIMIT page_limit OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for share_count
CREATE OR REPLACE FUNCTION update_post_share_count() RETURNS trigger AS $$
BEGIN
  IF NEW.original_post_id IS NOT NULL THEN
    UPDATE posts SET share_count = share_count + 1 WHERE id = NEW.original_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_post_share_count_trigger
AFTER INSERT ON posts FOR EACH ROW
EXECUTE FUNCTION update_post_share_count();
