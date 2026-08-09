// Service Worker pro Rodinný Dashboard
// Opravuje modal CSS konflikt a upravuje mobilní rychlou navigaci.
const CACHE_NAME = 'rodinny-dashboard-v3';

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

      // Skryj modaly ve výchozím stavu. Otevření řídí třída .open.
      html = html.replace(
        /\.modal-ov\s*\{\s*position:\s*fixed !important;([\s\S]*?)display:\s*flex !important;/,
        function(match, rest) {
          return '.modal-ov { position: fixed !important;' + rest + 'display: none !important;';
        }
      );
      html = html.replace('</style>', '.modal-ov.open { display: flex !important; }\n</style>');

      // openM/closeM používají třídu open, aby fungovaly i přes !important.
      html = html.replace(
        "window.openM=id=>{document.getElementById(id).style.display='flex';_ci()};",
        "window.openM=id=>{const e=document.getElementById(id);if(e){e.classList.add('open');e.style.display='';}_ci()};"
      );
      html = html.replace(
        "window.closeM=id=>{document.getElementById(id).style.display='none'};",
        "window.closeM=id=>{const e=document.getElementById(id);if(e){e.classList.remove('open');e.style.display='none'}};"
      );

      // MOBILNÍ NAVIGACE:
      // Nahraď CELÝ mobilní button Nastavení jedním centrálním tlačítkem Hlasem.
      // Nezasahujeme do desktopového sidebaru.
      const micBtn = '<button class="mob-nav-btn mob-mic-btn" onclick="toggleMic(\'todo-input-dash\')" aria-label="Nadiktovat úkol" title="Nadiktovat úkol"><span aria-hidden="true">🎙️</span><span>Hlasem</span></button>';
      const settingsPattern = /<button\b[^>]*class=["'][^"']*mob-nav-btn[^"']*["'][^>]*data-tab=["']nastaveni["'][^>]*>[\s\S]*?<\/button>/i;
      if (settingsPattern.test(html)) {
        html = html.replace(settingsPattern, micBtn);
      } else {
        // Fallback pro případ, že pořadí atributů v HTML bude jiné.
        const settingsPattern2 = /<button\b[^>]*data-tab=["']nastaveni["'][^>]*class=["'][^"']*mob-nav-btn[^"']*["'][^>]*>[\s\S]*?<\/button>/i;
        html = html.replace(settingsPattern2, micBtn);
      }

      html = html.replace('</style>', '.mob-mic-btn { color:#FFFFFF !important; background:#6366F1 !important; border:0 !important; border-radius:14px !important; min-width:58px !important; min-height:52px !important; margin-top:-10px !important; padding:6px 9px !important; box-shadow:0 6px 16px rgba(99,102,241,.28) !important; font-weight:700 !important; display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:center !important; gap:1px !important; } .mob-mic-btn span:first-child { font-size:20px; line-height:20px; } .mob-mic-btn span:last-child { font-size:9px; line-height:11px; font-weight:700; } .mob-mic-btn:active { transform:translateY(-8px) scale(.97) !important; }\n</style>');

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status:response.status, statusText:response.statusText, headers});
    } catch(e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(event.request);
    }
  })());
});