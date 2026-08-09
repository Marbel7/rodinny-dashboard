// Service Worker pro Rodinný Dashboard
// Stabilní verze: Service Worker NESMÍ přepisovat index.html.
// HTML/CSS/JS aplikace se načítá přímo z GitHub Pages.
const CACHE_NAME = 'rodinny-dashboard-v8';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
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

// Neprovádíme žádné HTML transformace ani fetch interception.
// Tím je PWA i Safari/desktop verze aplikace založena na stejném index.html.
