import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

export default function usePush() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false); // Prevent multiple inits

  useEffect(() => {
    const initAndSubscribe = async () => {
      console.log('Starting initAndSubscribe...');
      if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Skipping: No user or browser support for notifications.');
        return;
      }

      if (initialized) {
        console.log('OneSignal already initialized - skipping.');
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
        setInitialized(true); // Set flag

        const permission = await Notification.requestPermission();
        console.log('Notification Permission:', permission);
        if (permission !== 'granted') {
          console.log('Notification permission was not granted.');
          return;
        }

        // @ts-ignore - Suppress type error (method exists in SDK)
        await OneSignal.showSlidedownPrompt();

        // @ts-ignore - Suppress type error (method exists in SDK)
        const isSubscribed = await OneSignal.isPushNotificationsEnabled();
        console.log('Is Subscribed to OneSignal:', isSubscribed);
        if (!isSubscribed) {
          console.log('User is not subscribed to OneSignal push notifications.');
          return;
        }

        // @ts-ignore - Suppress type error (method exists in SDK)
        const playerId = await OneSignal.getUserId();
        console.log('OneSignal Player ID:', playerId);
        if (!playerId) {
          console.log('Could not retrieve OneSignal Player ID.');
          return;
        }

        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        console.log('Access Token:', accessToken ? 'Present' : 'Missing');
        if (!accessToken) {
          console.error('No Supabase access token found.');
          return;
        }

        const supabaseAuth = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          accessToken
        ); // Use token client for RLS

        const { error } = await supabaseAuth
          .from('user_profiles')
          .update({ onesignal_id: playerId })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to save OneSignal player ID to Supabase:', error.message, error.details, error.hint); // Enhanced error logging
        } else {
          console.log('🔔 OneSignal player ID saved to Supabase successfully!');
        }
      } catch (err) {
        console.error('An error occurred during OneSignal initialization or subscription:', err);
      }
    };

    initAndSubscribe();
  }, [user, initialized]);

  return {
    requestPushPermission: async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // @ts-ignore - Suppress type error (method exists in SDK)
          await OneSignal.showSlidedownPrompt();
        }
      }
    },
  };
}