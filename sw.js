// Service Worker pro Rodinný Dashboard
// DŮLEŽITÉ: Service Worker nesmí upravovat HTML. GitHub Pages musí servírovat
// aktuální index.html přímo, jinak může stará cache přepisovat živé UI.
const CACHE_NAME = 'rodinny-dashboard-v26';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await clients.claim();
  })());
});

self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(self.registration.showNotification(data.title || 'Rodinný Dashboard', {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      tag: data.tag || 'rodina',
      data: data.url || '/'
    }));
  } catch (e) {
    console.warn('[SW] Push error:', e);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

// Záměrně zde NENÍ fetch handler.
// Navigace, HTML, CSS a JS se načítají přímo z GitHub Pages.
// Tím odstraníme zdroj problémů, kdy Service Worker vracel starou/přepsanou verzi index.html.
