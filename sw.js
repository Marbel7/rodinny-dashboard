// Service Worker pro Rodinný Dashboard
// Opravuje modal CSS konflikt a upravuje mobilní rychlou navigaci.
const CACHE_NAME = 'rodinny-dashboard-v4';

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
      // Nahraď Nastavení centrálním tlačítkem Hlasem.
      const micBtn = '<button class="mob-nav-btn mob-mic-btn" onclick="toggleMic(\'todo-input-dash\')" aria-label="Nadiktovat úkol" title="Nadiktovat úkol"><span aria-hidden="true">🎙️</span><span>Hlasem</span></button>';
      const settingsPattern = /<button\b[^>]*class=["'][^"']*mob-nav-btn[^"']*["'][^>]*data-tab=["']nastaveni["'][^>]*>[\s\S]*?<\/button>/i;
      if (settingsPattern.test(html)) {
        html = html.replace(settingsPattern, micBtn);
      } else {
        const settingsPattern2 = /<button\b[^>]*data-tab=["']nastaveni["'][^>]*class=["'][^"']*mob-nav-btn[^"']*["'][^>]*>[\s\S]*?<\/button>/i;
        html = html.replace(settingsPattern2, micBtn);
      }

      // Přesné rozložení podle schváleného mobilního návrhu:
      // Přehled | Úkoly | Hlasem | Nákup | Výdaje
      // Každá položka má stejnou šířku 20 %. Mikrofon je přesně ve středu.
      html = html.replace('</style>', '.mobile-nav .mob-nav-btn { flex:1 1 0 !important; width:20% !important; min-width:0 !important; max-width:20% !important; padding-left:0 !important; padding-right:0 !important; } .mobile-nav .mob-nav-btn[data-tab="prehled"] { order:1 !important; } .mobile-nav .mob-nav-btn[data-tab="ukoly"] { order:2 !important; } .mobile-nav .mob-nav-btn[data-tab="seznamy"] { order:4 !important; } .mobile-nav .mob-nav-btn[data-tab="vydaje"] { order:5 !important; } .mobile-nav .mob-mic-btn { order:3 !important; position:relative !important; overflow:visible !important; color:#FFFFFF !important; background:transparent !important; box-shadow:none !important; border-radius:0 !important; min-height:48px !important; margin-top:0 !important; padding:0 !important; z-index:2 !important; } .mobile-nav .mob-mic-btn::before { content:""; position:absolute; left:50%; top:50%; width:66px; height:66px; transform:translate(-50%,-50%); border-radius:50%; background:#6366F1; box-shadow:0 6px 18px rgba(99,102,241,.34); z-index:-1; } .mobile-nav .mob-mic-btn span:first-child { font-size:22px !important; line-height:22px !important; display:block !important; position:relative !important; z-index:1 !important; } .mobile-nav .mob-mic-btn span:last-child { font-size:10px !important; line-height:12px !important; font-weight:700 !important; display:block !important; position:relative !important; z-index:1 !important; margin-top:2px !important; } .mobile-nav .mob-mic-btn:active { transform:scale(.97) !important; }\n</style>');

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status:response.status, statusText:response.statusText, headers});
    } catch(e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(event.request);
    }
  })());
});