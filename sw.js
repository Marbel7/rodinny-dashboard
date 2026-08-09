// Service Worker pro Rodinný Dashboard
// Minimální implementace pro Notification/Push funkcionalitu

const CACHE_NAME = 'rodinny-dashboard-v1';

// Instalace
self.addEventListener('install', function(event) {
  console.log('[SW] Install');
  self.skipWaiting();
});

// Aktivace
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate');
  event.waitUntil(clients.claim());
});

// Push notifikace (pro budoucí web push)
self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'Rodinný Dashboard';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      tag: data.tag || 'rodina',
      data: data.url || '/'
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch(e) {
    console.warn('[SW] Push error:', e);
  }
});

// Kliknutí na notifikaci
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Fetch — bez cache, pass-through
self.addEventListener('fetch', function(event) {
  // Nezasahujeme do Firebase/Firestore requestů
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }
  // Ostatní requesty nechte projít normálně
  event.respondWith(fetch(event.request).catch(function() {
    return new Response('Offline', { status: 503 });
  }));
});
