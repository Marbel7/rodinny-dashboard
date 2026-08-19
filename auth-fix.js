// Auth compatibility fix for mobile browsers (especially iOS Safari).
// The original app binds signInWithPopup() to the login button. Popups can be
// blocked on mobile, so use Firebase redirect flow there instead.
(function(){
  'use strict';

  var MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));

  if(!MOBILE) return;

  function isLoginButton(el){
    return el && (el.id === 'btn-login' || el.closest && el.closest('#btn-login'));
  }

  async function install(){
    var btn=document.getElementById('btn-login');
    if(!btn) return;

    try{
      var appMod=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      var authMod=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
      var app=appMod.getApps().length ? appMod.getApp() : appMod.initializeApp({
        apiKey:'AIzaSyA8WFwNZ_ljLSmK7cvdWufEsY9vGsi9Ers',
        authDomain:'rodinny-dashboard-4c316.firebaseapp.com',
        projectId:'rodinny-dashboard-4c316',
        storageBucket:'rodinny-dashboard-4c316.firebasestorage.app',
        messagingSenderId:'854662524014',
        appId:'1:854662524014:web:6b960a6088878c34c4ca7f'
      });
      var auth=authMod.getAuth(app);
      var provider=new authMod.GoogleAuthProvider();

      // Capture phase runs before the original inline onclick and prevents the
      // popup attempt from firing on mobile.
      btn.addEventListener('click',async function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        btn.disabled=true;
        var old=btn.textContent;
        btn.textContent='Přihlašuji…';
        try{
          console.info('[AUTH-FIX] mobile redirect sign-in');
          await authMod.signInWithRedirect(auth,provider);
        }catch(err){
          console.error('[AUTH-FIX] signInWithRedirect failed',err);
          btn.disabled=false;
          btn.textContent=old;
          var msg=err && (err.code || err.message) ? (err.code+': '+err.message) : String(err);
          if(window.toast) window.toast('Chyba přihlášení: '+msg,'error');
          else alert('Chyba přihlášení: '+msg);
        }
      },true);

      console.info('[AUTH-FIX] installed for mobile browser');
    }catch(err){
      console.error('[AUTH-FIX] initialization failed',err);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
