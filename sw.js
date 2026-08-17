// Service Worker pro Rodinný Dashboard
// Stabilní PWA: deterministické opravy zdrojového HTML.
const CACHE_NAME = 'rodinny-dashboard-v15';

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

      const navMarker = "window.switchTab('prehled');\n  loadAll();";
      const navFix = "window.switchTab('prehled');\n  requestAnimationFrame(()=>window.switchTab('prehled'));\n  loadAll();";
      if (html.includes(navMarker) && !html.includes('requestAnimationFrame(()=>window.switchTab(\'prehled\'))')) html = html.replace(navMarker, navFix);

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

      const css = `<style id="shopping-list-fix">
#seznam-detail #sz-input{flex:1 1 auto!important;min-width:0!important;width:auto!important;height:44px!important}
#seznam-detail #sz-qty{flex:0 0 110px!important;width:110px!important;height:44px!important}
#seznam-detail .card>div[style*="display:flex"]{align-items:center!important}
#seznam-detail #sz-items .list-item{min-height:44px}
#seznam-detail #sz-items .list-text{min-width:0;overflow-wrap:anywhere}
@media(max-width:560px){#seznam-detail #sz-qty{flex-basis:92px!important;width:92px!important}#seznam-detail .card>div[style*="display:flex"]{gap:6px!important}}
</style>`;
      if (!html.includes('id="shopping-list-fix"')) html = html.replace('</head>', css + '</head>');

      const micCss = `<style id="mobile-mic-nav-fix">
@media(max-width:768px){.mobile-nav{display:flex!important;justify-content:space-around!important;align-items:center!important}.mobile-nav .mob-nav-btn{flex:1 1 0!important;min-width:0!important;max-width:none!important}.mobile-nav .mob-nav-mic{flex:0 0 58px!important;width:58px!important;height:58px!important;min-height:58px!important;margin-top:-18px!important;padding:0!important;border-radius:50%!important;background:#6366F1!important;color:#fff!important;border:4px solid var(--sidebar-bg)!important;box-shadow:0 4px 14px rgba(99,102,241,.45)!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:2px!important}.mobile-nav .mob-nav-mic svg{width:25px!important;height:25px!important;stroke:#fff!important}.mobile-nav .mob-nav-mic{font-size:9px!important;font-weight:700!important}}
</style>`;
      if (!html.includes('id="mobile-mic-nav-fix"')) html = html.replace('</head>', micCss + '</head>');

      // ===== CÍLE — FÁZE 1 (robustní) =====
      // Vkládáme běžný inline script do HTML. Není závislý na přesném formátování původního JS.
      const goalScript = `<script id="goals-phase1-native-fix">\n(function(){\n  function initGoalsPhase1(){\n    var pv=document.getElementById('c-pv');\n    if(!pv) return;\n    var progressFg=pv.closest('.fg');\n    if(!progressFg || document.getElementById('c-price')) return;\n    var wrap=document.createElement('div');\n    wrap.className='fr';\n    wrap.innerHTML='<div class="fg"><label class="fl">Cena cíle (Kč)</label><input type="number" class="fi" id="c-price" placeholder="např. 50000" min="0" step="1"></div><div class="fg"><label class="fl">Termín splnění</label><input type="date" class="fi" id="c-deadline"></div>';\n    progressFg.parentNode.insertBefore(wrap,progressFg);\n\n    var oldSave=window.saveC;\n    var oldEdit=window.editC;\n    var oldLoad=window.loadC;\n    function decorateGoals(){\n      try{\n        var goals=(window.D&&Array.isArray(D.cile))?D.cile:[];\n        var cards=document.querySelectorAll('.cil');\n        cards.forEach(function(card,i){\n          var c=goals[i]; if(!c) return;\n          var head=card.querySelector('.cil-hdr>div'); if(!head) return;\n          var meta=head.querySelector('.goals-phase1-meta');\n          if(!meta){ meta=document.createElement('div'); meta.className='goals-phase1-meta'; head.appendChild(meta); }\n          var bits=[];\n          if(Number(c.cena)>0) bits.push('Cíl: '+(typeof kc==='function'?kc(c.cena):Number(c.cena).toLocaleString('cs-CZ')+' Kč'));\n          if(c.termin){ var dt=new Date(c.termin+'T00:00:00'); bits.push('Termín: '+dt.toLocaleDateString('cs-CZ')); }\n          meta.textContent=bits.join('  ·  '); meta.style.display=bits.length?'block':'none';\n        });\n        var total=goals.reduce(function(sum,c){return sum+(Number(c.cena)||0)},0);\n        var stat=document.getElementById('s-cile');\n        if(stat && total){\n          var value=document.getElementById('s-cile-hodnota');\n          if(!value){ value=document.createElement('div'); value.id='s-cile-hodnota'; value.style.cssText='font-size:11px;color:var(--text-3);margin-top:2px'; stat.parentNode.appendChild(value); }\n          value.textContent=typeof kc==='function'?kc(total):total.toLocaleString('cs-CZ')+' Kč';\n        }\n      }catch(e){ console.warn('[Goals] decorate',e); }\n    }\n    if(typeof oldLoad==='function' && !oldLoad.__goalsPhase1){\n      var load=function(){ return oldLoad.apply(this,arguments).then(function(r){ decorateGoals(); return r; }); };\n      load.__goalsPhase1=true; window.loadC=load;\n    }\n    if(typeof oldEdit==='function' && !oldEdit.__goalsPhase1){\n      var edit=function(id){ var r=oldEdit.apply(this,arguments); setTimeout(function(){ var c=(window.D&&D.cile||[]).find(function(x){return x.id===id}); if(c){ var p=document.getElementById('c-price'),d=document.getElementById('c-deadline'); if(p)p.value=c.cena||''; if(d)d.value=c.termin||''; } },0); return r; };\n      edit.__goalsPhase1=true; window.editC=edit;\n    }\n    if(typeof oldSave==='function' && !oldSave.__goalsPhase1){\n      var save=function(){\n        var price=document.getElementById('c-price');\n        var deadline=document.getElementById('c-deadline');\n        var eid=document.getElementById('ce-id')?.value||'';\n        if(!price && !deadline) return oldSave();\n        var p=price ? (parseFloat(price.value)||0) : 0;\n        var d=deadline ? (deadline.value||'') : '';\n        if(eid){\n          return updateDoc(famDoc('cile',eid),{cena:p,termin:d}).then(function(){ return oldSave(); });\n        }\n        return oldSave().then(function(){\n          try{ var c=D.cile[D.cile.length-1]; if(c&&c.id){ return updateDoc(famDoc('cile',c.id),{cena:p,termin:d}); } }catch(e){ console.warn('[Goals] metadata save',e); }\n        });\n      };\n      save.__goalsPhase1=true;\n      window.saveC=save;\n    }\n    decorateGoals();\n  }\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initGoalsPhase1); else initGoalsPhase1();\n  setTimeout(initGoalsPhase1,500);\n  setTimeout(initGoalsPhase1,1500);\n  setTimeout(initGoalsPhase1,2500);\n})();\n</script>`;
      if (!html.includes('id="goals-phase1-native-fix"')) html = html.replace('</body>', goalScript + '</body>');

      const goalCss = `<style id="goals-phase1-css">.goals-phase1-meta{font-size:11px;color:var(--text-2);margin-top:3px}.goals-phase1-price{font-size:12px;font-weight:700;color:var(--text);margin-top:4px}</style>`;
      if (!html.includes('id="goals-phase1-css"')) html = html.replace('</head>', goalCss + '</head>');

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status: response.status, statusText: response.statusText, headers});
    } catch (e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(request);
    }
  })());
});
