(function(){
  'use strict';

  function polish(){
    const panel=document.getElementById('panel-ukoly');
    if(!panel) return;

    const rows=panel.querySelectorAll('.todo-add + div');
    if(rows[0]) rows[0].classList.add('todo-date-row');
    if(rows[1]) rows[1].classList.add('todo-who-row');

    const dateRow=panel.querySelector('.todo-date-row');
    const whoRow=panel.querySelector('.todo-who-row');
    if(!dateRow || !whoRow) return;

    dateRow.setAttribute('aria-label','Termín úkolu');
    whoRow.setAttribute('aria-label','Komu je úkol určen');

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
      if(!b.dataset.tasksFixKeyboard){
        b.dataset.tasksFixKeyboard='1';
        b.addEventListener('keydown',function(e){
          if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}
        });
      }
    });
    whoRow.querySelectorAll('.todo-qw').forEach(function(b){
      b.setAttribute('role','button');
      b.setAttribute('tabindex','0');
      if(!b.dataset.tasksFixKeyboard){
        b.dataset.tasksFixKeyboard='1';
        b.addEventListener('keydown',function(e){
          if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}
        });
      }
    });

    if(!document.getElementById('tasks-fix-style')){
      const style=document.createElement('style');
      style.id='tasks-fix-style';
      style.textContent=`
        #panel-ukoly > .card{padding:18px!important;border-radius:20px!important;overflow:hidden!important}
        #panel-ukoly .todo-add{display:flex!important;gap:10px!important;margin:0 0 12px!important}
        #panel-ukoly .todo-add .fi{height:50px!important;font-size:16px!important;border-radius:15px!important;padding:0 15px!important;background:#fff!important}
        #panel-ukoly .todo-add .btn-p{width:50px!important;min-width:50px!important;height:50px!important;border-radius:15px!important;padding:0!important;box-shadow:0 5px 14px rgba(99,102,241,.16)!important}

        #panel-ukoly .todo-date-row{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;margin:0 0 11px!important;padding:1px 1px 4px!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important}
        #panel-ukoly .todo-date-row::-webkit-scrollbar,#panel-ukoly .todo-who-row::-webkit-scrollbar{display:none!important}
        #panel-ukoly .todo-date-row .todo-qd{position:relative!important;flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:36px!important;padding:0 13px!important;border-radius:12px!important;border:1px solid #E4E8F0!important;background:#F8FAFC!important;color:#64748B!important;font-size:12px!important;font-weight:700!important;white-space:nowrap!important;cursor:pointer!important;transition:transform .15s ease,background .15s ease,border-color .15s ease,box-shadow .15s ease!important}
        #panel-ukoly .todo-date-row .todo-qd:active,#panel-ukoly .todo-who-row .todo-qw:active{transform:scale(.97)!important}
        #panel-ukoly .todo-date-row .todo-qd.active{background:#6366F1!important;border-color:#6366F1!important;color:#fff!important;box-shadow:0 4px 12px rgba(99,102,241,.20)!important}
        #panel-ukoly .todo-date-row .todo-qd[data-val=""]:before{content:'○'!important;margin-right:6px!important;font-size:13px!important;line-height:1!important}
        #panel-ukoly .todo-date-row .todo-qd[data-val="dnes"]:before{content:'•'!important;margin-right:6px!important;font-size:16px!important;line-height:1!important}
        #panel-ukoly .todo-date-row .todo-qd[data-val="zitra"]:before{content:'›'!important;margin-right:6px!important;font-size:17px!important;line-height:1!important}
        #panel-ukoly .todo-date-row .todo-qd[data-val="tyden"]:before{content:'▦'!important;margin-right:6px!important;font-size:12px!important;line-height:1!important}
        #panel-ukoly .todo-date-row .todo-qd[data-val="other"]{padding-left:12px!important;padding-right:12px!important}

        #panel-ukoly .todo-who-row{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:nowrap!important;margin:0!important;overflow-x:auto!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important}
        #panel-ukoly .todo-who-row > span:first-child{flex:0 0 auto!important;color:#94A3B8!important;font-size:11px!important;font-weight:800!important;letter-spacing:.02em!important;margin-right:1px!important;text-transform:uppercase!important}
        #panel-ukoly .todo-who-row .todo-qw{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:34px!important;padding:0 13px!important;border-radius:11px!important;border:1px solid #E1E6EF!important;background:#fff!important;color:#64748B!important;font-size:12px!important;font-weight:700!important;white-space:nowrap!important;cursor:pointer!important;transition:transform .15s ease,background .15s ease,border-color .15s ease,box-shadow .15s ease!important}
        #panel-ukoly .todo-who-row .todo-qw.active{background:#EEF2FF!important;border-color:#A5B4FC!important;color:#4F46E5!important;box-shadow:inset 0 0 0 1px rgba(99,102,241,.05)!important}

        #panel-ukoly #todo-list{margin-top:16px!important}
        #panel-ukoly #todo-list .todo-v2-group{margin-bottom:14px!important}
        #panel-ukoly #todo-list .todo-v2-ghdr{font-size:12px!important;font-weight:800!important;letter-spacing:.02em!important;margin-bottom:5px!important}
        #panel-ukoly #todo-list .todo-v2-item{padding:11px 4px!important;min-height:48px!important}

        @media(max-width:600px){
          #panel-ukoly > .card{padding:16px!important}
          #panel-ukoly .todo-add .fi{height:48px!important}
          #panel-ukoly .todo-add .btn-p{width:48px!important;min-width:48px!important;height:48px!important}
          #panel-ukoly .todo-date-row .todo-qd{height:35px!important;padding:0 11px!important}
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

  document.addEventListener('click',function(e){
    const b=e.target.closest && e.target.closest('[data-tab="ukoly"]');
    if(b) setTimeout(polish,30);
  });
})();
