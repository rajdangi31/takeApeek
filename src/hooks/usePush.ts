import { useEffect, useState, useCallback, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Global state management for OneSignal
const oneSignalState = {
  initialized: false,
  initializing: false,
  lastPlayerId: null as string | null,
};

export default function usePush() {
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState<{
    initialized: boolean;
    subscribed: boolean;
    playerId: string | null;
    error: string | null;
  }>({
    initialized: false,
    subscribed: false,
    playerId: null,
    error: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Initialize OneSignal once per app lifecycle
  const initializeOneSignal = useCallback(async () => {
    if (oneSignalState.initialized || oneSignalState.initializing) {
      console.log('🔄 OneSignal already initialized or initializing');
      return true;
    }

    console.log('🚀 Initializing OneSignal...');
    oneSignalState.initializing = true;

    try {
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        // Remove notifyButton since we’re handling subscription manually
      });

      oneSignalState.initialized = true;
      oneSignalState.initializing = false;

      console.log('✅ OneSignal initialized successfully');

      // Set up event listeners
      OneSignal.User.PushSubscription.addEventListener('change', handleSubscriptionChange);

      return true;
    } catch (error: any) {
      console.error('❌ OneSignal initialization error:', error);
      oneSignalState.initializing = false;
      setPushStatus(prev => ({ ...prev, error: 'Failed to initialize OneSignal' }));
      return false;
    }
  }, []);

  // Handle subscription state changes
  const handleSubscriptionChange = useCallback((event: any) => {
    console.log('🔄 OneSignal subscription changed:', event);

    const isSubscribed: boolean = !!OneSignal.User.PushSubscription.optedIn;
    const playerId: string | null = OneSignal.User.onesignalId ?? null;

    console.log('New subscription state:', { isSubscribed, playerId });

    setPushStatus(prev => ({
      ...prev,
      subscribed: isSubscribed,
      playerId: playerId,
    }));

    // Update database if we have a new player ID
    if (playerId && playerId !== oneSignalState.lastPlayerId) {
      oneSignalState.lastPlayerId = playerId;
      updatePlayerIdInDatabase(playerId);
    }
  }, [user]);

  // Update player ID in database with retry logic
  const updatePlayerIdInDatabase = useCallback(async (playerId: string, retryCount = 0) => {
    if (!user) return;

    try {
      console.log(`🔄 Updating database with player ID: ${playerId} (attempt ${retryCount + 1})`);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('No valid session');
      }

      await supabase.auth.setSession(sessionData.session);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          onesignal_id: playerId,
          onesignal_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log('✅ Player ID updated successfully in database');

      // Verify the update worked
      await verifyDatabaseUpdate(playerId);

    } catch (error: any) {
      console.error('❌ Database update error:', error);

      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying database update in ${delay}ms...`);

        retryTimeoutRef.current = setTimeout(() => {
          updatePlayerIdInDatabase(playerId, retryCount + 1);
        }, delay);
      } else {
        setPushStatus(prev => ({ ...prev, error: 'Failed to update database' }));
      }
    }
  }, [user, supabase]);

  // Verify database update
  const verifyDatabaseUpdate = useCallback(async (expectedPlayerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onesignal_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data.onesignal_id === expectedPlayerId) {
        console.log('✅ Database update verified');
      } else {
        console.warn('⚠️ Database verification failed:', {
          expected: expectedPlayerId,
          actual: data.onesignal_id
        });
      }
    } catch (error: any) {
      console.error('❌ Database verification error:', error);
    }
  }, [user, supabase]);

  // Request push permission and subscribe
  const requestPushPermission = useCallback(async () => {
    if (!oneSignalState.initialized) {
      const initialized = await initializeOneSignal();
      if (!initialized) return false;
    }

    try {
      console.log('📱 Requesting notification permission...');

      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);

      if (permission !== 'granted') {
        setPushStatus(prev => ({ ...prev, error: 'Notification permission denied' }));
        return false;
      }

      // Subscribe to push notifications
      console.log('🔔 Subscribing to push notifications...');
      await OneSignal.Slidedown.promptPush();

      // Wait for subscription to complete
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        const isSubscribed: boolean = !!OneSignal.User.PushSubscription.optedIn;
        const playerId: string | null = OneSignal.User.onesignalId ?? null;

        console.log(`⏳ Subscription check ${attempts + 1}/${maxAttempts}:`, { isSubscribed, playerId });

        if (isSubscribed && playerId) {
          console.log('✅ Successfully subscribed to push notifications');

          setPushStatus({
            initialized: true,
            subscribed: true,
            playerId: playerId,
            error: null,
          });

          // Update database
          await updatePlayerIdInDatabase(playerId);
          return true;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      throw new Error('Subscription timeout - unable to get player ID');

    } catch (error: any) {
      console.error('❌ Push permission error:', error);
      setPushStatus(prev => ({ ...prev, error: error.message || 'Unknown error' }));
      return false;
    }
  }, [initializeOneSignal, updatePlayerIdInDatabase]);

  // Check existing subscription status
  const checkExistingSubscription = useCallback(async () => {
    if (!oneSignalState.initialized) return;

    try {
      const isSubscribed: boolean = !!OneSignal.User.PushSubscription.optedIn;
      const playerId: string | null = OneSignal.User.onesignalId ?? null;

      console.log('🔍 Checking existing subscription:', { isSubscribed, playerId });

      setPushStatus({
        initialized: true,
        subscribed: isSubscribed,
        playerId: playerId,
        error: null,
      });

      // If we have a player ID but it's different from what's in the database, update it
      if (playerId && playerId !== oneSignalState.lastPlayerId) {
        oneSignalState.lastPlayerId = playerId;
        await updatePlayerIdInDatabase(playerId);
      }

    } catch (error: any) {
      console.error('❌ Error checking subscription:', error);
      setPushStatus(prev => ({ ...prev, error: 'Failed to check subscription status' }));
    }
  }, [updatePlayerIdInDatabase]);

  // Main effect - initialize and check status
  useEffect(() => {
    if (!user) return;

    const initAndCheck = async () => {
      console.log('🔄 Starting push notification setup for user:', user.id);

      // Initialize OneSignal
      const initialized = await initializeOneSignal();
      if (!initialized) return;

      // Check existing subscription
      await checkExistingSubscription();
    };

    initAndCheck();

    // Cleanup
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user?.id, initializeOneSignal, checkExistingSubscription]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...pushStatus,
    requestPushPermission,
    refreshSubscription: checkExistingSubscription,
  };
}
