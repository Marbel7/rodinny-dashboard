// Service Worker pro Rodinný Dashboard
// Stabilní PWA: deterministické opravy zdrojového HTML.
const CACHE_NAME = 'rodinny-dashboard-v22';

self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });

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

      html = html.replace('.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:flex;', '.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:none;');
      html = html.replace('.modal-ov {\n  position: fixed !important;\n  inset: 0 !important;\n  background: rgba(15,23,42,.45) !important;\n  display: flex !important;', '.modal-ov {\n  position: fixed !important;\n  inset: 0 !important;\n  background: rgba(15,23,42,.45) !important;\n  display: flex;');
      html = html.replace('.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:flex !important;', '.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,0.6);display:none;');

      const navMarker = "window.switchTab('prehled');\n  loadAll();";
      const navFix = "window.switchTab('prehled');\n  requestAnimationFrame(()=>window.switchTab('prehled'));\n  loadAll();";
      if (html.includes(navMarker) && !html.includes("requestAnimationFrame(()=>window.switchTab('prehled'))")) html = html.replace(navMarker, navFix);

      const oldAdd = "window.addSzItem=async()=>{const text=document.getElementById('sz-input').value.trim(),qty=document.getElementById('sz-qty').value.trim();if(!text)return;const sz=D.seznamy.find(s=>s.id===D.currentSz);if(!sz)return;const items=[...(sz.items||[]),{text,qty,done:false}];await updateDoc(famDoc('seznamy',D.currentSz),{items});sz.items=items;document.getElementById('sz-input').value='';document.getElementById('sz-qty').value='';renderSzDetail();renderSzGrid();stats()};";
      const newAdd = "window.addSzItem=async()=>{const text=document.getElementById('sz-input').value.trim(),qty=document.getElementById('sz-qty').value.trim();if(!text){toast('Zadej položku','error');return}const sz=D.seznamy.find(s=>s.id===D.currentSz);if(!sz){toast('Seznam není načten','error');return}const items=[...(sz.items||[]),{text,qty,done:false}];try{await setDoc(famDoc('seznamy',D.currentSz),{items},{merge:true});sz.items=items;document.getElementById('sz-input').value='';document.getElementById('sz-qty').value='';renderSzDetail();renderSzGrid();stats();toast('Položka přidána','success')}catch(e){console.error('[Seznam] addSzItem',e);toast('Položku se nepodařilo uložit: '+(e.code||e.message||'chyba'),'error')}};";
      if (html.includes(oldAdd)) html = html.replace(oldAdd, newAdd);

      const micMarker = `  <button class="mob-nav-btn" data-tab="seznamy" onclick="window.switchTab('seznamy')">`;
      const micButton = `  <button class="mob-nav-btn mob-nav-mic" type="button" onclick="toggleMic('todo-input-dash')" aria-label="Hlasové zadání úkolu" title="Hlasové zadání úkolu">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    Hlasem
  </button>\n`;
      if (html.includes(micMarker) && !html.includes('class="mob-nav-btn mob-nav-mic"')) html = html.replace(micMarker, micButton + micMarker);
      html = html.replace(/(<nav class="mobile-nav">[\s\S]*?)  <button class="mob-nav-btn" data-tab="nastaveni"[\s\S]*?<\/button>/, '$1');

      const css = `<style id="shopping-list-fix">\n#seznam-detail #sz-input{flex:1 1 auto!important;min-width:0!important;width:auto!important;height:44px!important}\n#seznam-detail #sz-qty{flex:0 0 110px!important;width:110px!important;height:44px!important}\n#seznam-detail .card>div[style*="display:flex"]{align-items:center!important}\n#seznam-detail #sz-items .list-item{min-height:44px}\n#seznam-detail #sz-items .list-text{min-width:0;overflow-wrap:anywhere}\n@media(max-width:560px){#seznam-detail #sz-qty{flex-basis:92px!important;width:92px!important}#seznam-detail .card>div[style*="display:flex"]{gap:6px!important}}\n</style>`;
      if (!html.includes('id="shopping-list-fix"')) html = html.replace('</head>', css + '</head>');

      const micCss = `<style id="mobile-mic-nav-fix">\n@media(max-width:768px){.mobile-nav{display:flex!important;justify-content:space-around!important;align-items:center!important}.mobile-nav .mob-nav-btn{flex:1 1 0!important;min-width:0!important;max-width:none!important}.mobile-nav .mob-nav-mic{flex:0 0 58px!important;width:58px!important;height:58px!important;min-height:58px!important;margin-top:-18px!important;padding:0!important;border-radius:50%!important;background:#6366F1!important;color:#fff!important;border:4px solid var(--sidebar-bg)!important;box-shadow:0 4px 14px rgba(99,102,241,.45)!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:2px!important}.mobile-nav .mob-nav-mic svg{width:25px!important;height:25px!important;stroke:#fff!important}.mobile-nav .mob-nav-mic{font-size:9px!important;font-weight:700!important}}\n</style>`;
      if (!html.includes('id="mobile-mic-nav-fix"')) html = html.replace('</head>', micCss + '</head>');

      const odchodCss = `<style id="odchod-checkbox-fix">\n.odchod-check{width:22px!important;height:22px!important;min-width:22px!important;border:2px solid var(--border)!important;border-radius:6px!important;background:var(--surface)!important;color:transparent!important;font-size:0!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-shadow:none!important;opacity:1!important}\n.odchod-check.done{border-color:var(--accent)!important;background:var(--accent)!important;color:#fff!important;font-size:13px!important;font-weight:800!important;opacity:1!important}\n.odchod-item:hover .odchod-check{border-color:var(--accent)!important}\n</style>`;
      if (!html.includes('id="odchod-checkbox-fix"')) html = html.replace('</head>', odchodCss + '</head>');

      const quickCss = `<style id="quick-actions-v3">\n.qa-btn-v2.qa-v3{gap:4px!important;padding:10px 4px 9px!important;min-height:104px!important;justify-content:flex-start!important}\n.qa-btn-v2.qa-v3 .qa-btn-v2-icon{width:42px!important;height:42px!important;border-radius:12px!important}\n.qa-btn-v2.qa-v3 .qa-btn-v2-icon svg{width:22px!important;height:22px!important}\n.qa-btn-v2.qa-v3>span:not(.qa-stat){font-size:12px!important;font-weight:600!important;line-height:1.15!important;color:var(--text-2)!important}\n.qa-btn-v2.qa-v3 .qa-stat{display:block!important;min-height:14px!important;font-size:11px!important;line-height:1.1!important;font-weight:700!important;color:var(--text-3)!important;white-space:nowrap!important}\n@media(max-width:600px){.qa-btn-v2.qa-v3{min-height:98px!important}.qa-btn-v2.qa-v3 .qa-stat{font-size:10px!important}}\n</style>`;
      if (!html.includes('id="quick-actions-v3"')) html = html.replace('</head>', quickCss + '</head>');

      const quickScript = '<script src="/dashboard-enhancements.js"></script>';
      if (!html.includes('/dashboard-enhancements.js')) html = html.replace('</body>', quickScript + '</body>');

      const todoToggleMarker = '<button id="todo-dash-toggle" onclick="(function(){var c=document.getElementById(\'todo-dash-content\');var b=document.getElementById(\'todo-dash-toggle\');var open=c.style.display!==\'none\';c.style.display=open?\'none\':\'block\';b.innerHTML=open?\'Zobrazit úkoly ↓\':\'Skrýt ↑\';})()" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--accent);font-weight:600;padding:4px 0;margin-bottom:4px;font-family:inherit">Skrýt ↑</button>';
      const todoToggleClosed = '<button id="todo-dash-toggle" onclick="(function(){var c=document.getElementById(\'todo-dash-content\');var b=document.getElementById(\'todo-dash-toggle\');var open=c.style.display!==\'none\';c.style.display=open?\'none\':\'block\';b.innerHTML=open?\'Zobrazit úkoly ↓\':\'Skrýt ↑\';})()" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--accent);font-weight:600;padding:4px 0;margin-bottom:4px;font-family:inherit">Zobrazit úkoly ↓</button>';
      if (html.includes(todoToggleMarker)) html = html.replace(todoToggleMarker, todoToggleClosed);
      html = html.replace('<div id="todo-dash-content" style="display:block">', '<div id="todo-dash-content" style="display:none">');

      // Checkbox úkolů — sjednocení se stavem „splněno“ z referenčního projektu.
      const todoCheckCss = `<style id="todo-checkbox-v2">\n.todo-check{width:24px!important;height:24px!important;min-width:24px!important;border:2px solid #E2E5ED!important;border-radius:7px!important;background:#fff!important;color:transparent!important;font-size:0!important;line-height:1!important;display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 24px!important;box-shadow:none!important;transition:background .15s,border-color .15s,transform .1s!important}\n.todo-check.done,.todo-check.checked,.todo-check.is-done,.todo-check[aria-checked="true"]{border-color:#6366F1!important;background:#6366F1!important;color:#fff!important;font-size:15px!important;font-weight:800!important}\n.todo-check.done::after,.todo-check.checked::after,.todo-check.is-done::after,.todo-check[aria-checked="true"]::after{content:'✓';color:#fff!important;font-size:15px!important;font-weight:800!important;line-height:1!important}\n.todo-check.done svg,.todo-check.checked svg,.todo-check.is-done svg,.todo-check[aria-checked="true"] svg{stroke:#fff!important;color:#fff!important}\n.todo-text.done,.todo-text.checked,.todo-text.is-done{text-decoration:line-through!important;color:#94A3B8!important}\n</style>`;
      if (!html.includes('id="todo-checkbox-v2"')) html = html.replace('</head>', todoCheckCss + '</head>');

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status: response.status, statusText: response.statusText, headers});
    } catch (e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(request);
    }
  })());
});
