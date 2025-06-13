// public/sw.js  –– *keep this file tiny and framework-agnostic*

self.addEventListener('push', event => {
  const { title, body, url } = event.data.json()

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/Logo.png',     // change if you keep your icons elsewhere
      data: { url }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
