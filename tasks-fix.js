(function(){
  'use strict';

  function polish(){
    const panel=document.getElementById('panel-ukoly');
    if(!panel) return;

    // Add stable hooks to the existing markup. The enhancement script expected
    // these hooks, but the original HTML never had them.
    const rows=panel.querySelectorAll('.todo-add + div');
    if(rows[0] && !rows[0].classList.contains('todo-date-row')) rows[0].classList.add('todo-date-row');
    if(rows[1] && !rows[1].classList.contains('todo-who-row')) rows[1].classList.add('todo-who-row');

    const dateRow=panel.querySelector('.todo-date-row');
    const whoRow=panel.querySelector('.todo-who-row');
    if(!dateRow || !whoRow) return;

    dateRow.setAttribute('aria-label','Termín úkolu');
    whoRow.setAttribute('aria-label','Komu je úkol určen');

    const custom=dateRow.querySelector('#todo-date-custom');
    const other=dateRow.querySelector('[data-val="other"]');
    if(other){
      other.textContent='Více';
      other.setAttribute('title','Vybrat vlastní datum');
      other.setAttribute('aria-label','Vybrat vlastní datum');
    }

    const whoLabel=whoRow.querySelector('span:not(.todo-qw)');
    if(whoLabel) whoLabel.textContent='Pro';

    dateRow.querySelectorAll('.todo-qd').forEach(function(b){
      b.setAttribute('role','button');
      b.setAttribute('tabindex','0');
      b.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}
      });
    });
    whoRow.querySelectorAll('.todo-qw').forEach(function(b){
      b.setAttribute('role','button');
      b.setAttribute('tabindex','0');
      b.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}
      });
    });

    if(!document.getElementById('tasks-fix-style')){
      const style=document.createElement('style');
      style.id='tasks-fix-style';
      style.textContent=`
        #panel-ukoly > .card{padding:18px!important;border-radius:18px!important}
        #panel-ukoly .todo-add{display:flex!important;gap:10px!important;margin-bottom:14px!important}
        #panel-ukoly .todo-add .fi{height:48px!important;font-size:16px!important;border-radius:14px!important}
        #panel-ukoly .todo-add .btn-p{width:48px!important;min-width:48px!important;height:48px!important;border-radius:14px!important;padding:0!important}
        #panel-ukoly .todo-date-row{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;margin:0 0 12px!important;padding:1px 1px 4px!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important}
        #panel-ukoly .todo-date-row::-webkit-scrollbar{display:none!important}
        #panel-ukoly .todo-date-row .todo-qd{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:36px!important;padding:0 13px!important;border-radius:999px!important;border:1px solid var(--border)!important;background:var(--surface-2)!important;color:var(--text-2)!important;font-size:12px!important;font-weight:650!important;white-space:nowrap!important;cursor:pointer!important;transition:all .15s ease!important}
        #panel-ukoly .todo-date-row .todo-qd.active{background:var(--accent)!important;border-color:var(--accent)!important;color:#fff!important;box-shadow:0 3px 9px rgba(99,102,241,.18)!important}
        #panel-ukoly .todo-date-row .todo-qd[data-val="other"]{padding-left:12px!important;padding-right:12px!important}
        #panel-ukoly .todo-who-row{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:nowrap!important;margin:0!important;overflow-x:auto!important;scrollbar-width:none!important}
        #panel-ukoly .todo-who-row::-webkit-scrollbar{display:none!important}
        #panel-ukoly .todo-who-row > span:first-child{flex:0 0 auto!important;color:var(--text-3)!important;font-size:12px!important;font-weight:650!important;margin-right:2px!important}
        #panel-ukoly .todo-who-row .todo-qw{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:34px!important;padding:0 13px!important;border-radius:999px!important;border:1px solid var(--border)!important;background:var(--surface)!important;color:var(--text-2)!important;font-size:12px!important;font-weight:650!important;white-space:nowrap!important;cursor:pointer!important;transition:all .15s ease!important}
        #panel-ukoly .todo-who-row .todo-qw.active{background:var(--accent-soft)!important;border-color:#C7D2FE!important;color:var(--accent-hover)!important}
        #panel-ukoly #todo-list{margin-top:16px!important}
        #panel-ukoly #todo-list .todo-v2-group{margin-bottom:14px!important}
        #panel-ukoly #todo-list .todo-v2-ghdr{font-size:12px!important;font-weight:700!important;letter-spacing:.01em!important;margin-bottom:4px!important}
        #panel-ukoly #todo-list .todo-v2-item{padding:11px 4px!important;min-height:48px!important}
        @media(max-width:600px){
          #panel-ukoly > .card{padding:16px!important}
          #panel-ukoly .todo-date-row .todo-qd{height:35px!important;padding:0 12px!important}
          #panel-ukoly .todo-who-row .todo-qw{height:34px!important;padding:0 12px!important}
        }
      `;
      document.head.appendChild(style);
    }
  }

  function run(){
    polish();
    setTimeout(polish,80);
    setTimeout(polish,350);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();

  // The app switches panels without navigation; re-apply when the Tasks tab becomes visible.
  document.addEventListener('click',function(e){
    const b=e.target.closest && e.target.closest('[data-tab="ukoly"]');
    if(b) setTimeout(polish,30);
  });
})();
