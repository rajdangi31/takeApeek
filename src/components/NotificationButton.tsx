import { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationButton = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setIsLoading(false);
      }
    };
    checkSubscription();
  }, []);

  const handleSubscribeClick = async () => {
    if (isSubscribed) {
      // TODO: Implement unsubscription logic if needed
      alert('You are already subscribed!');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push Notifications are not supported in this browser.');
      return;
    }

    try {
      setIsLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      // Call our Supabase Edge Function to save the subscription
      const { error } = await supabase.functions.invoke('save-subscription', {
        body: subscription,
      });

      if (error) throw error;
      
      console.log('User subscribed successfully!');
      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Failed to subscribe. Please make sure you have granted permission.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribeClick}
      disabled={isLoading || isSubscribed}
      className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Loading...' : isSubscribed ? 'Subscribed!' : 'Enable Bestie Notifications'}
    </button>
  );
};