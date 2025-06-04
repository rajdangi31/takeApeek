// supabase/functions/send-notifications/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, message, title, url } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    // Get the user's besties (accepted friends)
    const { data: bestieRelations, error: bestiesError } = await supabase
      .from('besties')
      .select('user_id, bestie_id')
      .or(`and(user_id.eq.${userId},status.eq.accepted),and(bestie_id.eq.${userId},status.eq.accepted)`)

    if (bestiesError) {
      console.error('Error fetching besties:', bestiesError)
      throw bestiesError
    }

    // Extract friend IDs
    const friendIds = bestieRelations?.map(relation => 
      relation.user_id === userId ? relation.bestie_id : relation.user_id
    ) || []

    if (friendIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No besties to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get push subscriptions for the friends
    const { data: subscriptions, error: subError } = await supabase
      .from('user_profiles')
      .select('id, push_subscription')
      .in('id', friendIds)
      .not('push_subscription', 'is', null)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      throw subError
    }

    // Get the poster's name for the notification
    const { data: poster } = await supabase
      .from('user_profiles')
      .select('user_name, email')
      .eq('id', userId)
      .single()

    const posterName = poster?.user_name || poster?.email?.split('@')[0] || 'Someone'

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    if (!vapidPrivateKey) {
      throw new Error('VAPID_PRIVATE_KEY not configured')
    }

    // Send notifications to each subscription
    const notificationPromises = subscriptions?.map(async (user) => {
      try {
        const subscription = JSON.parse(user.push_subscription)
        
        const notificationPayload = {
          title: title || `${posterName} shared a new peek! 👀`,
          body: message || `Check out what ${posterName} is up to`,
          icon: '/icon-192x192.png', // Add your app icon
          badge: '/badge-72x72.png', // Add your badge icon
          url: url || '/', // URL to open when notification is clicked
          tag: 'new-peek', // Prevents duplicate notifications
          requireInteraction: false,
          timestamp: Date.now()
        }

        // Import webpush for Deno
        const { default: webpush } = await import('https://esm.sh/web-push@3.6.6')
        
        webpush.setVapidDetails(
          'mailto:dangiprince263@gmail.com', // Your email
          'BEUFQQcYV4NcHzw2XpCG7Dv3UgqUSzwqSl9QK2ZeHfSeXJN7gjq8SgPf06lD2ACnRT7Kml8H1a8qVW7yUWKMqEHbGw==', // Your VAPID public key
          vapidPrivateKey
        )

        await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        )

        return { success: true, userId: user.id }
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error)
        return { success: false, userId: user.id, error: error.message }
      }
    }) || []

    const results = await Promise.allSettled(notificationPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} notifications to besties`,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})