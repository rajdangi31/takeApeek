import { useState, useEffect } from 'react';
import { supabase } from './supabase-client'; // Adjust path to your supabase client

export const usePushNotifications = (userId?: string) => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const subscribeUser = async () => {
    if (!isSupported || !userId) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // You'll need to generate VAPID keys for production
      // For now, this is a placeholder - we'll add the actual key later
      const vapidPublicKey = 'BET5ATiCATxFgwqYU90xcd9Yn6IUYD4iXpofAMiTg468njArKR5tVBtZSS6arzrNIqdNn2o8U1ryikwxN7_QBGQ' ;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Save subscription to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          push_subscription: subscription.toJSON(),
          push_enabled: true
        })
        .eq('id', userId);

      if (error) throw error;

      setSubscription(subscription);
      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe user:', error);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    if (!subscription || !userId) return;

    setLoading(true);
    try {
      await subscription.unsubscribe();

      // Update Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          push_subscription: null,
          push_enabled: false
        })
        .eq('id', userId);

      if (error) throw error;

      setSubscription(null);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setSubscription(subscription);
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribeUser,
    unsubscribeUser,
    checkSubscription
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}