import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

export default function usePush() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!user) return;

    const initAndSubscribe = async () => {
      console.log('Starting initAndSubscribe...');
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Skipping: No browser support.');
        return;
      }

      if (initialized) {
        console.log('Already initialized - skipping.');
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
        setInitialized(true);

        const permission = await Notification.requestPermission();
        console.log('Permission:', permission);
        if (permission !== 'granted') return;

        await OneSignal.Slidedown.promptPush();

        const isSubscribed = OneSignal.User.PushSubscription.optedIn;
        console.log('Subscribed:', isSubscribed);
        if (!isSubscribed) return;

        const onesignalId = OneSignal.User.onesignalId; // Consistent naming
        console.log('OneSignal ID:', onesignalId);
        if (!onesignalId) return;

        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        console.log('Access Token:', accessToken ? 'Present' : 'Missing');
        if (!accessToken) return;

        const supabaseAuth = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          accessToken
        );

        const { error } = await supabaseAuth
          .from('user_profiles')
          .update({ onesignal_id: onesignalId })
          .eq('id', user.id);

        if (error) {
          console.error('Save error:', error.message, error.details, error.hint);
        } else {
          console.log('🔔 Saved!');
        }
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    initAndSubscribe();
  }, [user, initialized]);

  return {
    requestPushPermission: async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await OneSignal.Slidedown.promptPush();
      }
    },
  };
}