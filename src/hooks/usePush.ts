import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Global flag to prevent multiple initializations
let oneSignalInitialized = false;

export default function usePush() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!user || oneSignalInitialized) return;

    const initAndSubscribe = async () => {
      console.log('Starting initAndSubscribe...');

      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Skipping: No browser support.');
        return;
      }

      try {
        // Mark as initializing to prevent race conditions
        oneSignalInitialized = true;

        await OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true,
            prenotify: true,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'Subscribe to notifications',
              'tip.state.subscribed': "You're subscribed to notifications",
              'tip.state.blocked': "You've blocked notifications",
              'message.prenotify': 'Click to subscribe to notifications',
              'message.action.subscribed': 'Thanks for subscribing!',
              'message.action.resubscribed': "You're subscribed again!",
              'message.action.unsubscribed': "You won't receive notifications anymore",
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
        
        // Wait for subscription to complete and ID to be generated
        let attempts = 0;
        let onesignalId = null;
        
        while (!onesignalId && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const isSubscribed = OneSignal.User.PushSubscription.optedIn;
          console.log(`Attempt ${attempts + 1} - Subscribed:`, isSubscribed);
          
          if (!isSubscribed) {
            attempts++;
            continue;
          }
          
          onesignalId = OneSignal.User.onesignalId;
          console.log(`Attempt ${attempts + 1} - OneSignal ID:`, onesignalId);
          
          if (!onesignalId) {
            attempts++;
          }
        }

        if (!onesignalId) {
          console.log('Failed to get OneSignal ID after 10 attempts');
          return;
        }

        // Create Supabase client with proper authentication
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        // Get the session to use the access token for RLS
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        
        console.log('Access Token:', session?.access_token ? 'Present' : 'Missing');

        if (!session?.access_token) {
          console.log('No session or access token available');
          return;
        }

        // Set the session for the authenticated user
        await supabase.auth.setSession(session);

        const { error } = await supabase
          .from('user_profiles')
          .update({ onesignal_id: onesignalId })
          .eq('id', user.id);

        if (error) {
          console.error('Save error:', error.message, error.details, error.hint);
        } else {
          console.log('🔔 OneSignal ID saved successfully!');
        }

      } catch (err) {
        console.error('Init error:', err);
        // Reset the flag on error so it can be retried
        oneSignalInitialized = false;
      }
    };

    initAndSubscribe();
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-runs

  return {
    initialized,
    requestPushPermission: async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await OneSignal.Slidedown.promptPush();
      }
    },
  };
}