// public/sw.js
self.addEventListener('push', function(event) {
  console.log('Push message received:', event)

  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (error) {
      console.error('Error parsing push data:', error)
      data = {
        title: 'New notification',
        body: 'You have a new update!',
        icon: '/icon-192x192.png'
      }
    }
  }

  const options = {
    body: data.body || 'You have a new update!',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    timestamp: data.timestamp || Date.now(),
    data: {
      url: data.url || '/',
      clickAction: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Update', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const urlToOpen = event.notification.data?.url || event.notification.data?.clickAction || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event)
  // You can track notification dismissals here if needed
})