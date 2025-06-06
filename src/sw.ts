/// <reference lib="WebWorker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// This is injected by the VitePWA plugin. It precaches all your assets.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json();
  if (!data) return;

  const title = data.title || 'New Notification';
  const options: NotificationOptions = {
    body: data.body,
    icon: '/pwa-192x192.png', // A default icon
    badge: '/badge-72x72.png', // A small badge icon
    data: {
      url: data.url, // Pass a URL to open on click
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      // If a window is already open, focus it.
      const hadWindowToFocus = clientsArr.some(
        (windowClient) => windowClient.url === urlToOpen && 'focus' in windowClient && windowClient.focus()
      );
      // Otherwise, open a new window.
      if (!hadWindowToFocus) {
        self.clients.openWindow(urlToOpen);
      }
    })
  );
});