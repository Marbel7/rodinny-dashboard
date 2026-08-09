// Service Worker pro Rodinný Dashboard
// Opravuje modal CSS konflikt, mobilní rychlou navigaci a robustní ukládání položek seznamů.
const CACHE_NAME = 'rodinny-dashboard-v6';

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

      html = html.replace(
        /\.modal-ov\s*\{\s*position:\s*fixed !important;([\s\S]*?)display:\s*flex !important;/,
        function(match, rest) {
          return '.modal-ov { position: fixed !important;' + rest + 'display: none !important;';
        }
      );
      html = html.replace('</style>', '.modal-ov.open { display: flex !important; }\n</style>');

      html = html.replace(
        "window.openM=id=>{document.getElementById(id).style.display='flex';_ci()};",
        "window.openM=id=>{const e=document.getElementById(id);if(e){e.classList.add('open');e.style.display='';}_ci()};"
      );
      html = html.replace(
        "window.closeM=id=>{document.getElementById(id).style.display='none'};",
        "window.closeM=id=>{const e=document.getElementById(id);if(e){e.classList.remove('open');e.style.display='none'}};"
      );

      // MOBILNÍ NAVIGACE: Přehled | Úkoly | Hlasem | Nákup | Výdaje.
      const micBtn = '<button class="mob-nav-btn mob-mic-btn" onclick="toggleMic(\'todo-input-dash\')" aria-label="Nadiktovat úkol" title="Nadiktovat úkol"><span aria-hidden="true">🎙️</span><span>Hlasem</span></button>';
      const settingsPattern = /<button\b[^>]*class=["'][^"']*mob-nav-btn[^"']*["'][^>]*data-tab=["']nastaveni["'][^>]*>[\s\S]*?<\/button>/i;
      if (settingsPattern.test(html)) {
        html = html.replace(settingsPattern, micBtn);
      } else {
        const settingsPattern2 = /<button\b[^>]*data-tab=["']nastaveni["'][^>]*class=["'][^"']*mob-nav-btn[^"']*["'][^>]*>[\s\S]*?<\/button>/i;
        html = html.replace(settingsPattern2, micBtn);
      }

      html = html.replace('</style>', '.mobile-nav .mob-nav-btn { flex:1 1 0 !important; width:20% !important; min-width:0 !important; max-width:20% !important; padding-left:0 !important; padding-right:0 !important; } .mobile-nav .mob-nav-btn[data-tab="prehled"] { order:1 !important; } .mobile-nav .mob-nav-btn[data-tab="ukoly"] { order:2 !important; } .mobile-nav .mob-nav-btn[data-tab="seznamy"] { order:4 !important; } .mobile-nav .mob-nav-btn[data-tab="vydaje"] { order:5 !important; } .mobile-nav .mob-mic-btn { order:3 !important; position:relative !important; overflow:visible !important; color:#FFFFFF !important; background:transparent !important; box-shadow:none !important; border-radius:0 !important; min-height:48px !important; margin-top:0 !important; padding:0 !important; z-index:2 !important; } .mobile-nav .mob-mic-btn::before { content:""; position:absolute; left:50%; top:50%; width:66px; height:66px; transform:translate(-50%,-50%); border-radius:50%; background:#6366F1; box-shadow:0 6px 18px rgba(99,102,241,.34); z-index:-1 !important; } .mobile-nav .mob-mic-btn span:first-child { font-size:22px !important; line-height:22px !important; display:block !important; position:relative !important; z-index:1 !important; } .mobile-nav .mob-mic-btn span:last-child { font-size:10px !important; line-height:12px !important; font-weight:700 !important; display:block !important; position:relative !important; z-index:1 !important; margin-top:2px !important; } .mobile-nav .mob-mic-btn:active { transform:scale(.97) !important; }\n</style>');

      // OPRAVA SEZNAMŮ: ukládání položek přes merge.
      const oldAdd = "window.addSzItem=async()=>{const text=document.getElementById('sz-input').value.trim(),qty=document.getElementById('sz-qty').value.trim();if(!text)return;const sz=D.seznamy.find(s=>s.id===D.currentSz);if(!sz)return;const items=[...(sz.items||[]),{text,qty,done:false}];await updateDoc(famDoc('seznamy',D.currentSz),{items});sz.items=items;document.getElementById('sz-input').value='';document.getElementById('sz-qty').value='';renderSzDetail();renderSzGrid();stats()};";
      const newAdd = "window.addSzItem=async()=>{const text=document.getElementById('sz-input').value.trim(),qty=document.getElementById('sz-qty').value.trim();if(!text){toast('Zadej položku','error');return}const sz=D.seznamy.find(s=>s.id===D.currentSz);if(!sz){toast('Seznam není načten','error');return}const items=[...(sz.items||[]),{text,qty,done:false}];try{await setDoc(famDoc('seznamy',D.currentSz),{items},{merge:true});sz.items=items;document.getElementById('sz-input').value='';document.getElementById('sz-qty').value='';renderSzDetail();renderSzGrid();stats();toast('Položka přidána','success')}catch(e){console.error('[Seznam] addSzItem',e);toast('Položku se nepodařilo uložit: '+(e.code||e.message||'chyba'),'error')}};";
      if (html.includes(oldAdd)) html = html.replace(oldAdd, newAdd);

      // NOVÝ VZHLED FORMULÁŘE SEZNAMU:
      // V DOMu je nyní množství před hlavním textovým polem. Přeskládáme
      // pouze tento konkrétní řádek do pořadí: položka | množství | +.
      // Řádek je flexbox, takže se chová správně i na mobilu.
      const listFixScript = `<script>(function(){
        function fixShoppingUI(){
          var text=document.getElementById('sz-input');
          var qty=document.getElementById('sz-qty');
          if(text&&qty){
            var parent=text.parentElement;
            if(parent&&qty.parentElement===parent){
              var children=Array.from(parent.children);
              var addBtn=children.find(function(el){return el.tagName==='BUTTON';});
              parent.style.display='flex';
              parent.style.flexDirection='row';
              parent.style.alignItems='center';
              parent.style.gap='10px';
              parent.style.width='100%';
              parent.style.flexWrap='nowrap';
              parent.style.gridTemplateColumns='none';
              parent.appendChild(text);
              parent.appendChild(qty);
              if(addBtn) parent.appendChild(addBtn);
              text.style.display='block';
              text.style.flex='1 1 auto';
              text.style.width='auto';
              text.style.minWidth='0';
              text.style.height='56px';
              text.style.padding='0 16px';
              text.style.fontSize='16px';
              text.placeholder='Co potřebujete?';
              qty.style.display='block';
              qty.style.flex='0 0 110px';
              qty.style.width='110px';
              qty.style.minWidth='0';
              qty.style.height='56px';
              qty.style.padding='0 12px';
              qty.style.fontSize='15px';
              qty.placeholder='Množ.';
              if(addBtn){
                addBtn.style.flex='0 0 56px';
                addBtn.style.width='56px';
                addBtn.style.height='56px';
                addBtn.style.minWidth='56px';
                addBtn.style.padding='0';
                addBtn.style.display='inline-flex';
                addBtn.style.alignItems='center';
                addBtn.style.justifyContent='center';
                addBtn.setAttribute('aria-label','Přidat položku');
              }
            }
          }
          document.querySelectorAll('.list-item').forEach(function(row){
            var buttons=row.querySelectorAll('button');
            if(buttons.length){
              var del=buttons[buttons.length-1];
              del.style.width='36px';
              del.style.height='36px';
              del.style.minWidth='36px';
              del.style.padding='0';
              del.style.borderRadius='10px';
              del.style.display='inline-flex';
              del.style.alignItems='center';
              del.style.justifyContent='center';
              del.style.background='#FEF2F2';
              del.style.color='#EF4444';
              del.style.border='1px solid #FECACA';
              del.setAttribute('aria-label','Smazat položku');
              if(!del.textContent.trim() || del.textContent.trim().length>4) del.textContent='×';
            }
          });
        }
        if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fixShoppingUI); else fixShoppingUI();
        new MutationObserver(fixShoppingUI).observe(document.documentElement,{childList:true,subtree:true});
      })();</script>`;
      html = html.replace('</body>', listFixScript + '</body>');

      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(html, {status:response.status, statusText:response.statusText, headers});
    } catch(e) {
      console.warn('[SW] HTML patch failed:', e);
      return fetch(event.request);
    }
  })());
});