// CarePro — Push Notification Handlers
// Loaded via importScripts() inside the Workbox-generated service worker.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'CarePro', {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      tag: data.tag,
      renotify: !!data.renotify,
      data: { url: data.url || '/', notificationId: data.notificationId },
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((allClients) => {
        // Focus an existing window on this origin and navigate it.
        const existing = allClients.find(
          (c) => new URL(c.url).origin === self.location.origin
        );
        if (existing) {
          if ('navigate' in existing) existing.navigate(url);
          return existing.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});

// Fired when the browser invalidates or rotates the push subscription.
// We notify all open app windows so they can re-subscribe using the stored JWT.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((allClients) => {
        allClients.forEach((c) =>
          c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' })
        );
      })
  );
});
