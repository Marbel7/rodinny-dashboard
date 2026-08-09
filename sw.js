// Service Worker pro Rodinný Dashboard
// Opravuje konflikt modal CSS !important vs inline display:none.
const CACHE_NAME = 'rodinny-dashboard-v2';

self.addEventListener('install', function(event) {
  console.log('[SW] Install', CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activate', CACHE_NAME);
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
  } catch(e) { console.warn('[SW] Push error:', e); }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('firebase')) return;

  const isHtml = event.request.mode === 'navigate' ||
                 url.pathname.endsWith('/index.html') ||
                 url.pathname.endsWith('/rodinny-dashboard/');
  if (!isHtml) {
    event.respondWith(fetch(event.request).catch(function() {
      return new Response('Offline', {status:503});
    }));
    return;
  }

  event.respondWith((async function() {
    try {
      const response = await fetch(event.request);
      const type = response.headers.get('content-type') || '';
      if (!type.includes('text/html')) return response;
      let html = await response.text();

      // Skryj všechny modaly ve výchozím stavu. Původní index obsahuje
      // pozdější .modal-ov { display:flex !important }, který přebíjí
      // style="display:none" a proto se při startu zobrazují všechny modaly.
      html = html.replace(
        /\.modal-ov\s*\{\s*position:\s*fixed !important;([\s\S]*?)display:\s*flex !important;/,
        function(match, rest) {
          return '.modal-ov { position: fixed !important;' + rest + 'display: none !important;';
        }
      );
      html = html.replace('</style>', '.modal-ov.open { display: flex !important; }\n</style>');

      // openM/closeM používají třídu open, aby otevření fungovalo i přes !important.
      html = html.replace(
        "window.openM=id=>{document.getElementById(id).style.display='flex';_ci()};",
        "window.openM=id=>{const e=document.getElementById(id);if(e){e.classList.add('open');e.style.display='';}_ci()};"
      );
      html = html.replace(
        "window.closeM=id=>{document.getElementById(id).style.display='none'};",
        "window.closeM=id=>{const e=document.getElementById(id);if(e){e.classList.remove('open');e.style.display='none'}};"
      );

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status:response.status, statusText:response.statusText, headers});
    } catch(e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(event.request);
    }
  })());
});