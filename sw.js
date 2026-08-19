// Service Worker pro Rodinný Dashboard
// Stabilni HTML patch: opravuje rozbitou syntaxi a Google login pred parsovanim module scriptu.
const CACHE_NAME = 'rodinny-dashboard-v31';
const TASKS_FIX = '<script src="./tasks-fix.js?v=31"></script>';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await clients.claim();

    // The previous service worker may have loaded an unpatched index.html.
    // Reload controlled clients once after activation so the new fetch patch
    // is actually applied before the user presses Google login.
    const list = await clients.matchAll({type:'window', includeUncontrolled:true});
    await Promise.all(list.map(function(client) {
      try {
        if (client.url && client.url.includes('/rodinny-dashboard/') && !client.url.includes('swfix=31')) {
          return client.navigate(client.url + (client.url.includes('?') ? '&' : '?') + 'swfix=31');
        }
      } catch(e) {}
      return null;
    }));
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
    const broken = "document.addEventListener('click',function(){tuCloseVice();});window._todoDate=val;document.querySelectorAll('.todo-qd').forEach(function(b){b.classList.toggle('active',b.dataset.val===val)});var dc=document.getElementById('todo-date-custom');if(dc)dc.style.display=val==='other'?'inline-block':'none';};";
    const fixed = "document.addEventListener('click',function(){tuCloseVice();});window.setTodoDate=function(el,val){window._todoDate=val;document.querySelectorAll('.todo-qd').forEach(function(b){b.classList.toggle('active',b.dataset.val===val)});var dc=document.getElementById('todo-date-custom');if(dc)dc.style.display=val==='other'?'inline-block':'none';};";
    if (html.includes(broken)) html = html.replace(broken, fixed);

    // CRITICAL AUTH FIX:
    // Never send the user to firebaseapp.com after clicking Google.
    // On iOS Safari/private browsing that redirect handler can become a
    // blank white page. Keep authentication on the original page via popup.
    const oldLogin = `const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  setLoginStatus('Připojuji k Google…');
  try{
    if(isMobile){
      setLoginStatus('Přesměrovávám na Google…');
      await signInWithRedirect(auth,prov);
    }else{
      await signInWithPopup(auth,prov);
      setLoginStatus('✓ Přihlášeno','#10B981');
    }
  }catch(e){
    console.error('Auth error:',e.code,e.message);
    if(e.code==='auth/popup-blocked'||e.code==='auth/cancelled-popup-request'||e.code==='auth/popup-closed-by-user'){
      setLoginStatus('Popup blokován, přesměrovávám…');
      try{await signInWithRedirect(auth,prov);}
      catch(e2){setLoginStatus('Chyba: '+e2.message,'#EF4444');}
    }else{
      setLoginStatus('Chyba: '+e.code+' — '+e.message,'#EF4444');
    }
  }`;
    const popupOnly = `const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  setLoginStatus('Připojuji k Google…');
  try{
    await signInWithPopup(auth,prov);
    setLoginStatus('✓ Přihlášeno','#10B981');
  }catch(e){
    console.error('Auth error:',e.code,e.message);
    if(e.code==='auth/popup-blocked'){
      setLoginStatus('Safari zablokoval přihlášení. Povolte vyskakovací okno a zkuste to znovu.','#EF4444');
    }else if(e.code==='auth/cancelled-popup-request'||e.code==='auth/popup-closed-by-user'){
      setLoginStatus('Přihlášení bylo zrušeno. Zkuste to znovu.','#EF4444');
    }else{
      setLoginStatus('Chyba: '+e.code+' — '+e.message,'#EF4444');
    }
  }`;
    if (html.includes(oldLogin)) html = html.replace(oldLogin, popupOnly);

    // Also handle the already popup-first version that still contained a
    // redirect fallback.
    const fallbackLogin = `const isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  setLoginStatus('Připojuji k Google…');
  try{
    // Popup is intentionally preferred on mobile/iOS. It avoids the
    // firebaseapp.com redirect handler that can remain blank in
    // Safari private browsing. The call is made directly from the
    // button click so Safari can treat it as a user-initiated popup.
    await signInWithPopup(auth,prov);
    setLoginStatus('✓ Přihlášeno','#10B981');
  }catch(e){
    console.error('Auth error:',e.code,e.message);
    if(e.code==='auth/popup-blocked'||e.code==='auth/cancelled-popup-request'||e.code==='auth/popup-closed-by-user'){
      setLoginStatus('Popup blokován, přesměrovávám…');
      try{await signInWithRedirect(auth,prov);}
      catch(e2){setLoginStatus('Chyba: '+e2.message,'#EF4444');}
    }else{
      setLoginStatus('Chyba: '+e.code+' — '+e.message,'#EF4444');
    }
  }`;
    if (html.includes(fallbackLogin)) html = html.replace(fallbackLogin, popupOnly);

    // The redirect-result listener is harmless when no redirect is used, but
    // keep the HTML free of an automatic redirect path.
    if (!html.includes('auth-popup-only-v31')) {
      html = html.replace('</head>', '<meta name="auth-popup-only-v31" content="1">' + TASKS_FIX + '</head>');
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
