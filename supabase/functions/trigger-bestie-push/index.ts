import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import webpush from "https://esm.sh/web-push@3.4.5";

// Helper function to send a single push notification and handle errors
async function sendPush(supabaseAdmin: SupabaseClient, subscription: any, payload: string) {
  const vapidKeys = {
    publicKey: Deno.env.get('VITE_VAPID_PUBLIC_KEY')!,
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
  };

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      payload,
      {
        vapidDetails: {
          subject: 'mailto:dangiprince263@gmail.com', // Replace with your admin email
          publicKey: vapidKeys.publicKey,
          privateKey: vapidKeys.privateKey,
        },
      }
    );
  } catch (err: any) {
    // If a subscription is expired (410 GONE), delete it from the database.
    if (err.code === 410) {
      console.log(`Subscription expired for ${subscription.endpoint}, deleting.`);
      await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    } else {
      console.error('Error sending push notification:', err);
    }
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Destructure the full potential payload from the request
    const { actionType, actor, post, comment, parentComment, targetUser } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let usersToNotifyIds: string[] = [];
    let notificationPayload: object = {};

    // Main logic router based on the action type
    switch (actionType) {

        case 'NEW_POST': {
        // Find all users who have the actor as an accepted bestie
        const { data: besties } = await supabaseAdmin
          .from('besties')
          .select('user_id')
          .eq('bestie_id', actor.id)
          .eq('status', 'accepted');
        if (besties && besties.length > 0) {
          usersToNotifyIds = besties.map((b: any) => b.user_id);
          notificationPayload = {
            title: `Your bestie ${actor.username} shared a new peek!`,
            body: post.preview,
            url: `/posts/${post.id}`, // Or `/peeks/${post.id}`
          };
        }
        break;
      }
      case 'LIKE': {
        // Don't notify if a user likes their own post
        if (actor.id === post.ownerId) break;

        // Check if the actor is a "bestie" of the post owner
        const { data } = await supabaseAdmin.from('besties')
          .select('id')
          .eq('user_id', post.ownerId)
          .eq('bestie_id', actor.id)
          .eq('status', 'accepted') // Only for accepted besties
          .maybeSingle();

        if (data) { // If they are besties, notify the post owner
          usersToNotifyIds = [post.ownerId];
          notificationPayload = {
            title: `Your bestie ${actor.username} has an update!`,
            body: `They loved your post.`,
            url: `/posts/${post.id}`,
          };
        }
        break;
      }

      case 'COMMENT': {
        const uniqueUserIds = new Set<string>();

        // 1. Notify the post owner if the commenter is their bestie
        if (actor.id !== post.ownerId) {
          const { data } = await supabaseAdmin.from('besties')
            .select('id')
            .eq('user_id', post.ownerId)
            .eq('bestie_id', actor.id)
            .eq('status', 'accepted')
            .maybeSingle();
            
          if (data) {
            uniqueUserIds.add(post.ownerId);
          }
        }

        // 2. Notify the parent comment's author if it's a reply and they are besties
        if (parentComment && actor.id !== parentComment.ownerId) {
           const { data } = await supabaseAdmin.from('besties')
            .select('id')
            .eq('user_id', parentComment.ownerId)
            .eq('bestie_id', actor.id)
            .eq('status', 'accepted')
            .maybeSingle();

           if (data) {
             uniqueUserIds.add(parentComment.ownerId);
           }
        }
        
        usersToNotifyIds = Array.from(uniqueUserIds);
        if (usersToNotifyIds.length > 0) {
            notificationPayload = {
                title: `Your bestie ${actor.username} has an update!`,
                body: `Commented: "${comment.preview}"`,
                url: `/posts/${post.id}`,
            };
        }
        break;
      }
      
      case 'NEW_BESTIE_REQUEST': {
        // Directly notify the user who received the request
        usersToNotifyIds = [targetUser.id];
        notificationPayload = {
          title: '💌 You have a new Bestie Request!',
          body: `${actor.username} wants to be your bestie.`,
          url: `/besties`, // Link to the page where they can manage requests
        };
        break;
      }

      case 'BESTIE_REQUEST_ACCEPTED': {
        // Directly notify the user who originally sent the request
        usersToNotifyIds = [targetUser.id];
        notificationPayload = {
          title: '🎉 Bestie Request Accepted!',
          body: `${actor.username} accepted your bestie request.`,
          url: `/profile/${actor.id}`, // Link to the new bestie's profile
        };
        break;
      }

      default:
        console.warn(`Unknown actionType received: ${actionType}`);
        break;
    }

    if (usersToNotifyIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No notification required for this action.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch all push subscriptions for the users who need to be notified
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, keys')
      .in('user_id', usersToNotifyIds);

    if (subscriptions && subscriptions.length > 0) {
      const payloadString = JSON.stringify(notificationPayload);
      
      // Send all notifications in parallel
      const pushPromises = subscriptions.map((sub: any) => sendPush(supabaseAdmin, sub, payloadString));
      await Promise.all(pushPromises);

      return new Response(JSON.stringify({ success: true, sent_to_count: subscriptions.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ message: 'Users had no active push subscriptions.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in trigger-bestie-push function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});