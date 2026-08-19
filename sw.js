// Service Worker pro Rodinný Dashboard
// Auth oprava: Service Worker NESMÍ upravovat HTML ani vkládat auth-fix.js.
// Přihlašování je kompletně řízené jediným auth flow v index.html.
const CACHE_NAME = 'rodinny-dashboard-v29';
const TASKS_FIX = '<script src="./tasks-fix.js?v=29"></script>';

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

self.addEventListener('fetch', function(event) {
  if (event.request.mode !== 'navigate') return;

  event.respondWith((async function() {
    const response = await fetch(event.request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;

    // Auth fix byl odstraněn. Zachováváme pouze existující tasks-fix,
    // aby se nezměnilo chování záložky Úkoly.
    const html = await response.text();
    if (html.includes('tasks-fix.js')) {
      return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
    }

    const patched = html.replace('</head>', TASKS_FIX + '</head>');
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(patched, {status: response.status, statusText: response.statusText, headers: headers});
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
