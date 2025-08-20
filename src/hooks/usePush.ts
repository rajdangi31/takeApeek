import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

export default function usePush() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false); // Flag to prevent multiple inits

  useEffect(() => {
    const initAndSubscribe = async () => {
      console.log('Starting initAndSubscribe...');
      if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Skipping: No user or browser support.');
        return;
      }

      if (initialized) {
        console.log('Already initialized - skipping init.');
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
        setInitialized(true); // Set flag after init

        const permission = await Notification.requestPermission();
        console.log('Notification Permission:', permission);
        if (permission !== 'granted') {
          console.log('Permission not granted.');
          return;
        }

        await OneSignal.Slidedown.promptPush();

        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
        console.log('Is Subscribed to OneSignal:', isSubscribed);
        if (!isSubscribed) {
          console.log('Not subscribed.');
          return;
        }

        const playerId = OneSignal.User.onesignalId;
        console.log('OneSignal Player ID:', playerId);
        if (!playerId) {
          console.log('No Player ID.');
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
          console.error('No access token.');
          return;
        }

        const supabaseAuth = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          accessToken
        ); // Token client for RLS

        const { error } = await supabaseAuth
          .from('user_profiles')
          .update({ onesignal_id: playerId })
          .eq('id', user.id);

        if (error) {
          console.error('Save error:', error.message, error.details, error.hint); // Enhanced logging
        } else {
          console.log('🔔 Saved!');
        }
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    initAndSubscribe();
  }, [user, initialized]); // Added initialized to dependency

  return {
    requestPushPermission: async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await OneSignal.Slidedown.promptPush();
      }
    },
  };
}