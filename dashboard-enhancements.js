(function(){
  'use strict';

  function kc(v){
    const n = Number(v)||0;
    return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(n)+' Kč';
  }

  function setupQuickActions(){
    const buttons = Array.from(document.querySelectorAll('.qa-btn-v2'));
    if(buttons.length < 4) return;

    const configs = [
      { key:'todo', bg:'#EEF2FF', color:'#6366F1' },
      { key:'expense', bg:'#ECFDF5', color:'#10B981' },
      { key:'birthday', bg:'#FDF2F8', color:'#EC4899' },
      { key:'goal', bg:'#FFF7ED', color:'#F59E0B' }
    ];

    buttons.forEach((btn,i)=>{
      const cfg = configs[i];
      if(!cfg) return;
      btn.classList.add('qa-v3');
      btn.dataset.qaKey = cfg.key;
      const icon = btn.querySelector('.qa-btn-v2-icon');
      if(icon){
        icon.style.background = cfg.bg;
        icon.style.width = '42px';
        icon.style.height = '42px';
        icon.style.borderRadius = '12px';
        const svg = icon.querySelector('svg');
        if(svg){ svg.style.width='22px'; svg.style.height='22px'; svg.style.color=cfg.color; }
      }
      let stat = btn.querySelector('.qa-stat');
      if(!stat){
        stat = document.createElement('span');
        stat.className='qa-stat';
        btn.appendChild(stat);
      }
    });
  }

  function updateQuickStats(){
    if(!window.D) return;
    const todos = Array.isArray(D.todos) ? D.todos : [];
    const vydaje = Array.isArray(D.vydaje) ? D.vydaje : [];
    const cile = Array.isArray(D.cile) ? D.cile : [];
    const bdays = Array.isArray(D.bdays) ? D.bdays : [];

    const doneTodos = todos.filter(t=>t.done).length;
    const totalTodos = todos.length;
    const doneGoals = cile.filter(c=>(Number(c.progress)||0)>=100).length;

    const todoStat = document.querySelector('.qa-btn-v2[data-qa-key="todo"] .qa-stat');
    const expenseStat = document.querySelector('.qa-btn-v2[data-qa-key="expense"] .qa-stat');
    const birthdayStat = document.querySelector('.qa-btn-v2[data-qa-key="birthday"] .qa-stat');
    const goalStat = document.querySelector('.qa-btn-v2[data-qa-key="goal"] .qa-stat');

    if(todoStat) todoStat.textContent = totalTodos ? `${doneTodos}/${totalTodos}` : '0/0';
    if(expenseStat) expenseStat.textContent = vydaje.length ? kc(vydaje.reduce((s,v)=>s+(Number(v.castka)||0),0)) : '0 Kč';
    if(birthdayStat) birthdayStat.textContent = bdays.length ? String(bdays.length) : '0';
    if(goalStat) goalStat.textContent = `${doneGoals}/${cile.length}`;
  }

  function fixQuickMic(){
    const btn = document.getElementById('mic-btn-todo-input-dash');
    const input = document.getElementById('todo-input-dash');
    if(!btn || !input || btn.dataset.enhanced==='1') return;
    btn.dataset.enhanced='1';
    btn.type='button';
    btn.setAttribute('aria-label','Hlasové zadání úkolu');
    btn.title='Hlasové zadání úkolu';
    btn.textContent='';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
    btn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.toggleMic==='function') window.toggleMic('todo-input-dash');
      else if(typeof window.toast==='function') window.toast('Hlasové zadání není připravené','error');
    };
  }

  function polishTodoDashboard(){
    if(document.getElementById('todo-dashboard-polish-js')) return;

    const style=document.createElement('style');
    style.id='todo-dashboard-polish-js';
    style.textContent=`
      /* Dashboard Úkoly: kompaktní, přirozeně rostoucí karta */
      #te-fam-body{
        border-top:1px solid var(--border-light)!important;
        padding:10px 16px 14px!important;
      }
      #te-fam-body > div:first-child{
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        margin-bottom:10px!important;
      }
      #te-fam-body .fi{height:44px!important;}
      #te-fam-body .btn-p{
        height:44px!important;
        min-width:48px!important;
        padding:0 14px!important;
      }
      #todo-list-dash{margin:0!important;}
      #todo-list-dash .todo-v2-group{
        margin:0 0 10px!important;
      }
      #todo-list-dash .todo-v2-group:last-child{margin-bottom:0!important;}
      #todo-list-dash .todo-v2-ghdr{
        margin:2px 0 4px!important;
        padding:0!important;
        font-size:11px!important;
        line-height:18px!important;
      }
      #todo-list-dash .todo-v2-item{
        min-height:42px!important;
        padding:9px 4px!important;
      }
      #todo-list-dash .todo-v2-check{
        width:24px!important;
        height:24px!important;
        min-width:24px!important;
        border:2px solid #E2E5ED!important;
        border-radius:7px!important;
        background:#fff!important;
        color:transparent!important;
        font-size:0!important;
        line-height:1!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 24px!important;
        box-shadow:none!important;
      }
      #todo-list-dash .todo-v2-check.done{
        background:#6366F1!important;
        border-color:#6366F1!important;
        color:#fff!important;
        font-size:15px!important;
        font-weight:800!important;
      }
      #todo-list-dash .todo-v2-check.done::after{
        content:'✓';
        color:#fff!important;
        font-size:15px!important;
        font-weight:800!important;
        line-height:1!important;
      }
      #todo-list-dash .todo-v2-name.done{
        color:#94A3B8!important;
        text-decoration:line-through!important;
      }
      #todo-list-dash .todo-v2-del{
        width:32px!important;
        height:32px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:4px!important;
      }
      #todo-list-dash .todo-v2-del svg{width:17px!important;height:17px!important;}
      #te-fam-body .todo-v2-done-toggle{
        margin-top:6px!important;
        padding:8px 0!important;
      }
      @media(max-width:768px){
        #te-fam-body{padding-left:14px!important;padding-right:14px!important;}
        #te-fam-body > div:first-child{gap:7px!important;}
        #todo-list-dash .todo-v2-name{font-size:14px!important;}
        #todo-list-dash .todo-v2-meta{font-size:11px!important;}
      }
    `;
    document.head.appendChild(style);

    // Výchozí stav Dashboardu: sbaleno. Samostatná stránka Úkoly se tím nemění.
    const body=document.getElementById('te-fam-body');
    const chev=document.getElementById('te-fam-chev');
    if(body){
      body.style.display='none';
      if(chev) chev.textContent='↓';
    }
  }

  function hookRenderers(){
    ['renderTodos','renderV','renderC','renderBdays'].forEach(function(name){
      const fn=window[name];
      if(typeof fn!=='function' || fn._qaWrapped) return;
      const wrapped=function(){
        const r=fn.apply(this,arguments);
        setTimeout(updateQuickStats,0);
        return r;
      };
      wrapped._qaWrapped=true;
      window[name]=wrapped;
    });
  }

  function init(){
    setupQuickActions();
    hookRenderers();
    fixQuickMic();
    polishTodoDashboard();
    updateQuickStats();
    setTimeout(updateQuickStats,300);
    setTimeout(updateQuickStats,1000);
    setTimeout(updateQuickStats,2500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  let ticks=0;
  const timer=setInterval(function(){
    setupQuickActions();
    hookRenderers();
    fixQuickMic();
    polishTodoDashboard();
    updateQuickStats();
    if(++ticks>=40) clearInterval(timer);
  },500);
})();
