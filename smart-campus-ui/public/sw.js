/* Smart Campus Hub — Web Push service worker.
 *
 * Receives push events from the backend (signed with the VAPID private key),
 * renders an OS-level notification, and opens the associated deep link when
 * the user clicks it. Runs independently of any open tab.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notification', message: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Smart Campus Hub';
  const options = {
    body: data.message || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { link: data.link || '/' },
    tag: data.tag,
    requireInteraction: data.priority === 'HIGH',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Reuse an open window if one is already focused on the app.
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
