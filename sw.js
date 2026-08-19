// Service Worker pro Rodinný Dashboard
// Stabilni HTML patch: opravuje rozbitou syntaxi v index.html pred parsovanim module scriptu.
const CACHE_NAME = 'rodinny-dashboard-v30';
const TASKS_FIX = '<script src="./tasks-fix.js?v=30"></script>';

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

    let html = await response.text();

    // Oprava konkretniho syntax erroru v aktualnim index.html.
    // Chybela deklarace window.setTodoDate=function(el,val){...};
    // a kvuli tomu se cely module script vubec nespustil — vcetne login handleru.
    const broken = "document.addEventListener('click',function(){tuCloseVice();});window._todoDate=val;document.querySelectorAll('.todo-qd').forEach(function(b){b.classList.toggle('active',b.dataset.val===val)});var dc=document.getElementById('todo-date-custom');if(dc)dc.style.display=val==='other'?'inline-block':'none';};";
    const fixed = "document.addEventListener('click',function(){tuCloseVice();});window.setTodoDate=function(el,val){window._todoDate=val;document.querySelectorAll('.todo-qd').forEach(function(b){b.classList.toggle('active',b.dataset.val===val)});var dc=document.getElementById('todo-date-custom');if(dc)dc.style.display=val==='other'?'inline-block':'none';};";
    if (html.includes(broken)) html = html.replace(broken, fixed);

    // Zachovat tasks-fix, ale nevkladat ho opakovane.
    if (!html.includes('tasks-fix.js')) {
      html = html.replace('</head>', TASKS_FIX + '</head>');
    }

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(html, {status: response.status, statusText: response.statusText, headers: headers});
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
