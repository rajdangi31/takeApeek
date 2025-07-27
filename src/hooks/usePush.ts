import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

export default function usePush() {
  const { user } = useAuth();

  useEffect(() => {
    const initAndSubscribe = async () => {
      if (!user || !('Notification' in window) || !('serviceWorker' in navigator)) return;

      // ✅ Initialize OneSignal
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

      // ✅ Ask for browser notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      await OneSignal.Slidedown.promptPush();

      // ✅ Check subscription status
      const isSubscribed = OneSignal.User.PushSubscription.optedIn;
      if (!isSubscribed) return;

      const playerId = OneSignal.User.onesignalId;
      if (!playerId) return;

      // ✅ Create Supabase client
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // ✅ Attach user token for Row Level Security
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult?.data?.session?.access_token;

      if (!accessToken) {
        console.error('No Supabase access token');
        return;
      }

      // ✅ Create an authenticated Supabase client for this session
      const supabaseAuth = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        accessToken
      );

      // ✅ Save OneSignal player ID to user profile
      const { error } = await supabaseAuth
        .from('user_profiles')
        .update({ onesignal_id: playerId })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save player ID:', error);
      } else {
        console.log('🔔 OneSignal player ID saved to Supabase.');
      }
    };

    initAndSubscribe();
  }, [user]);

  return {
    // Optional manual trigger
    requestPushPermission: async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await OneSignal.Slidedown.promptPush();
      }
    },
  };
}