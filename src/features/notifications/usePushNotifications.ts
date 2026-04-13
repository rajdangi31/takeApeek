import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const VAPID_PUBLIC =
  "BET5ATiCATxFgwqYU90xcd9Yn6IUYD4iXpofAMiTg468njArKR5tVBtZSS6arzrNIqdNn2o8U1ryikwxN7_QBGQ";

/** Convert a URL-safe Base-64 key to the Uint8Array Push API expects */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Check for **minimum** Push-API support (https + SW + PushManager) */
function hasPushSupport() {
  const secureContext =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";
  return (
    secureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export const usePushNotifications = (userId?: string) => {
  /* ---------- state ---------- */
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<unknown>(null);

  /* ---------- initial feature-detection ---------- */
  useEffect(() => {
    setIsSupported(hasPushSupport());
  }, []);

  /* ---------- helper to read existing sub ---------- */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const current = await reg.pushManager.getSubscription();
      setSubscription(current);
      setIsSubscribed(Boolean(current));
    } catch (err) {
      console.error("⚠️  checkSubscription failed:", err);
      setLastError(err);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  /* ---------- subscribe ---------- */
  const subscribeUser = useCallback(async () => {
    console.log("🔔 subscribeUser called", { isSupported, userId });
    
    // Early return with proper loading reset
    if (!isSupported) {
      console.log("❌ Push not supported");
      return;
    }
    
    if (!userId) {
      console.log("❌ No userId provided");
      setLastError(new Error("User ID is required"));
      return;
    }

    setLoading(true);
    setLastError(null);

    try {
      console.log("🔄 Getting service worker...");
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Service worker timeout")), 10000);
      });
      
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ]) as ServiceWorkerRegistration;
      
      console.log("✅ Service worker ready:", reg);

      /** Request browser permission first */
      console.log("🔔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("🔔 Permission result:", permission);
      
      if (permission !== "granted") {
        throw new Error(`Notification permission was ${permission}`);
      }

      console.log("🔔 Subscribing to push manager...");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      
      console.log("✅ Push subscription created:", sub);

      /* Store in DB */
      console.log("💾 Saving to database...");
      
      const subJSON = sub.toJSON();
      
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: userId,
          endpoint: subJSON.endpoint!,
          p256dh: subJSON.keys?.p256dh!,
          auth: subJSON.keys?.auth!
        }, { onConflict: 'user_id, endpoint' });

      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }
      
      console.log("✅ Saved to database successfully");

      /* Local state */
      setSubscription(sub);
      setIsSubscribed(true);
      
      console.log("🎉 Subscription complete!");
      
    } catch (err) {
      console.error("⚠️  subscribeUser failed:", err);
      setLastError(err);
    } finally {
      console.log("🔄 Setting loading to false");
      setLoading(false);
    }
  }, [isSupported, userId]);

  /* ---------- unsubscribe ---------- */
  const unsubscribeUser = useCallback(async () => {
    if (!subscription || !userId) return;
    setLoading(true);
    setLastError(null);

    try {
      await subscription.unsubscribe();

      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", subscription.endpoint);

      if (error) throw error;

      setSubscription(null);
      setIsSubscribed(false);
    } catch (err) {
      console.error("⚠️  unsubscribeUser failed:", err);
      setLastError(err);
    } finally {
      setLoading(false);
    }
  }, [subscription, userId]);

  return {
    /* state */
    isSupported,
    isSubscribed,
    loading,
    lastError,
    /* actions */
    subscribeUser,
    unsubscribeUser,
    checkSubscription,
  };
};