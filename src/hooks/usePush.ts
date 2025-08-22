import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

export default function usePush() {
  const { user } = useAuth();

  useEffect(() => {
    const initAndSubscribe = async () => {
      console.log('Starting initAndSubscribe...'); // Debug start
      if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Skipping: No user or browser support for notifications.');
        return;
      }

      try {
        await OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true,
            prenotify: true,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'Subscribe to notifications',
              'tip.state.subscribed': 'You\'re subscribed to notifications',
              'tip.state.blocked': 'You\'ve blocked notifications',
              'message.prenotify': 'Click to subscribe to notifications',
              'message.action.subscribed': 'Thanks for subscribing!',
              'message.action.resubscribed': 'You\'re subscribed again!',
              'message.action.unsubscribed': 'You won’t receive notifications anymore',
              'message.action.subscribing': 'Subscribing...',
              'dialog.main.title': 'Notifications Settings',
              'dialog.main.button.subscribe': 'SUBSCRIBE',
              'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
              'dialog.blocked.title': 'Unblock Notifications',
              'dialog.blocked.message': 'Please follow these instructions to allow notifications:',
            },
          },
        });
        console.log('OneSignal initialized');

        const permission = await Notification.requestPermission();
        console.log('Notification Permission:', permission);
        if (permission !== 'granted') {
          console.log('Notification permission was not granted.');
          return;
        }

        await OneSignal.Slidedown.promptPush();

        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
        console.log('Is Subscribed to OneSignal:', isSubscribed);
        if (!isSubscribed) {
          console.log('User is not subscribed to OneSignal push notifications.');
          return;
        }

        const playerId = OneSignal.User.onesignalId;
        console.log('OneSignal Player ID:', playerId);
        if (!playerId) {
          console.log('Could not retrieve OneSignal Player ID.');
          return;
        }

        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        console.log('Supabase Access Token:', accessToken ? 'Present' : 'Missing');
        if (!accessToken) {
          console.error('No Supabase access token found. User might not be properly authenticated.');
          return;
        }

        // It is not recommended to create a new client with the access token directly.
        // The existing supabase client instance from `supabase-client.ts` will manage the auth token.
        // We will use the originally imported supabase client for the update.
        // The RLS policy will use the JWT from the request.
        const { error } = await supabase
          .from('user_profiles')
          .update({ onesignal_id: playerId })
          .eq('id', user.id);
        if (error) {
          console.error('Failed to save OneSignal player ID to Supabase:', error.message, error.details);
        } else {
          console.log('🔔 OneSignal player ID saved to Supabase successfully!');
        }
      } catch (err) {
        console.error('An error occurred during OneSignal initialization or subscription:', err);
      }
    };

    initAndSubscribe();
  }, [user]);

  return {
    // Optional manual trigger
    requestPushPermission: async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await OneSignal.Slidedown.promptPush();
        }
      }
    },
  };
}