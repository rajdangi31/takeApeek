-- =====================================================
-- PHASE 3: PUSH NOTIFICATION AUTOMATION (SQL)
-- =====================================================

-- 1. Create a function to trigger the Edge Function
-- This function sends a POST request to your Supabase Edge Function URL.
-- Note: You MUST replace 'YOUR_ANON_KEY' with your actual anon key if headers are required,
-- though for internal webhooks, Service Role is better but handled via the UI usually.
-- Here we setup the logic for the Net HTTP extension if available, or just a generic trigger.

CREATE OR REPLACE FUNCTION public.handle_new_post_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- We trigger the 'notify-post' Edge Function
  -- The payload will automatically include the 'record' (the new post)
  -- Supabase Webhooks handle the HTTP POST and secret signing automatically.
  PERFORM
    net.http_post(
      url := 'https://dkykifaennfzitehfkbz.supabase.co/functions/v1/notify-post',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || auth.role() -- or use service role in Dashboard
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_post_created_notification ON public.posts;
CREATE TRIGGER on_post_created_notification
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_post_notification();

-- -----------------------------------------------------
-- INSTRUCTIONS FOR USER:
-- -----------------------------------------------------
-- 1. In your Supabase Dashboard, go to 'Database' -> 'Webhooks'.
-- 2. Create a new Webhook:
--    - Name: 'notify_on_post'
--    - Table: 'posts'
--    - Events: 'INSERT'
--    - Type: 'Edge Function'
--    - Edge Function: 'notify-post'
-- 3. Alternatively, run the SQL above if you have the 'pg_net' extension enabled.
-- =====================================================
