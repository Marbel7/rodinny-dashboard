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

  function init(){
    setupQuickActions();
    fixQuickMic();
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
    fixQuickMic();
    updateQuickStats();
    if(++ticks>=20) clearInterval(timer);
  },500);
})();
