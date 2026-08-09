// Service Worker pro Rodinný Dashboard
// Stabilní PWA: deterministické opravy zdrojového HTML.
const CACHE_NAME = 'rodinny-dashboard-v11';

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
      body: data.body || '', icon: data.icon || '/icon-192.png', tag: data.tag || 'rodina', data: data.url || '/'
    }));
  } catch (e) { console.warn('[SW] Push error:', e); }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;
  if (request.mode !== 'navigate') return;

  event.respondWith((async function() {
    try {
      const response = await fetch(request);
      const type = response.headers.get('content-type') || '';
      if (!type.includes('text/html')) return response;
      let html = await response.text();

      // Důležité: zdrojová stránka má modal při načtení skrytý přes inline style.
      // CSS však dříve obsahovalo display:flex, takže na některých zařízeních
      // modal překryl inline display:none. Opravujeme obě možné varianty.
      html = html.replace(
        '.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:flex;',
        '.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:none;'
      );
      html = html.replace(
        '.modal-ov {\n  position: fixed !important;\n  inset: 0 !important;\n  background: rgba(15,23,42,.45) !important;\n  display: flex !important;',
        '.modal-ov {\n  position: fixed !important;\n  inset: 0 !important;\n  background: rgba(15,23,42,.45) !important;\n  display: flex;'
      );
      html = html.replace(
        '.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:flex !important;',
        '.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:none;'
      );

      // Ochrana výchozího panelu po přihlášení.
      const navMarker = "window.switchTab('prehled');\n  loadAll();";
      const navFix = "window.switchTab('prehled');\n  requestAnimationFrame(()=>window.switchTab('prehled'));\n  loadAll();";
      if (html.includes(navMarker) && !html.includes('requestAnimationFrame(()=>window.switchTab(\'prehled\'))')) {
        html = html.replace(navMarker, navFix);
      }

      // Oprava ukládání položek nákupního seznamu.
      const oldAdd = "window.addSzItem=async()=>{const text=document.getElementById('sz-input').value.trim(),qty=document.getElementById('sz-qty').value.trim();if(!text)return;const sz=D.seznamy.find(s=>s.id===D.currentSz);if(!sz)return;const items=[...(sz.items||[]),{text,qty,done:false}];await updateDoc(famDoc('seznamy',D.currentSz),{items});sz.items=items;document.getElementById('sz-input').value='';document.getElementById('sz-qty').value='';renderSzDetail();renderSzGrid();stats()};";
      const newAdd = "window.addSzItem=async()=>{const text=document.getElementById('sz-input').value.trim(),qty=document.getElementById('sz-qty').value.trim();if(!text){toast('Zadej položku','error');return}const sz=D.seznamy.find(s=>s.id===D.currentSz);if(!sz){toast('Seznam není načten','error');return}const items=[...(sz.items||[]),{text,qty,done:false}];try{await setDoc(famDoc('seznamy',D.currentSz),{items},{merge:true});sz.items=items;document.getElementById('sz-input').value='';document.getElementById('sz-qty').value='';renderSzDetail();renderSzGrid();stats();toast('Položka přidána','success')}catch(e){console.error('[Seznam] addSzItem',e);toast('Položku se nepodařilo uložit: '+(e.code||e.message||'chyba'),'error')}};";
      if (html.includes(oldAdd)) html = html.replace(oldAdd, newAdd);

      const css = `<style id="shopping-list-fix">
#seznam-detail #sz-input{flex:1 1 auto!important;min-width:0!important;width:auto!important;height:44px!important;}
#seznam-detail #sz-qty{flex:0 0 110px!important;width:110px!important;height:44px!important;}
#seznam-detail .card>div[style*="display:flex"]{align-items:center!important;}
#seznam-detail #sz-items .list-item{min-height:44px;}
#seznam-detail #sz-items .list-text{min-width:0;overflow-wrap:anywhere;}
@media(max-width:560px){#seznam-detail #sz-qty{flex-basis:92px!important;width:92px!important}#seznam-detail .card>div[style*="display:flex"]{gap:6px!important}}
</style>`;
      if (!html.includes('id="shopping-list-fix"')) html = html.replace('</head>', css + '</head>');

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status: response.status, statusText: response.statusText, headers});
    } catch (e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(request);
    }
  })());
});
