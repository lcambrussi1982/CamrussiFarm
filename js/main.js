
(function(){
  const CF=window.CF, st=CF.state;
  function bindBasics(){
    document.querySelectorAll('.tool').forEach(b=>{
      b.addEventListener('click',()=>{ document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active')); b.classList.add('active'); st.selectedTool=b.dataset.tool; document.getElementById('plantPalette').classList.toggle('hidden', st.selectedTool!=='plant'); },{passive:true});
    });
    document.getElementById('field').addEventListener('click',(e)=>{ const div=e.target.closest('.tile'); if(!div) return; const i=parseInt(div.dataset.i||'-1',10); if(isNaN(i)) return; CF.applyTool(i); });
    document.getElementById('sellNow').addEventListener('click',CF.harvestSell,{passive:true});
    document.getElementById('storeNow').addEventListener('click',CF.harvestStore,{passive:true});
    document.getElementById('btnSave').addEventListener('click',()=> CF.saveSlot(st.playerName),{passive:true});
    document.getElementById('btnLoad2').addEventListener('click',openLoadList,{passive:true});
    document.querySelectorAll('[data-close]').forEach(b=> b.addEventListener('click',()=> document.getElementById(b.dataset.close).classList.add('hidden'),{passive:true}));
    document.getElementById('modalBack').addEventListener('click',()=> Router.close(),{passive:true});
    document.querySelectorAll('.navbtn[data-open]').forEach(b=> b.addEventListener('click',()=> Router.open(b.dataset.open),{passive:true}));
    window.addEventListener('beforeunload',(e)=>{ if(st.dirty){ e.preventDefault(); e.returnValue='Alterações não salvas. Sair mesmo assim?'; return e.returnValue; } });
  }
  function startGameUI(){
    document.getElementById('splash').classList.add('hidden'); document.getElementById('app').classList.remove('hidden');
    CF.initEls(); CF.buildPlantPalette(); CF.render(); if(st.timer) clearInterval(st.timer); st.timer=setInterval(CF.tick, Math.max(1500, st.dayLenSec*1000/100));
  }
  function newGame(){ const name=(document.getElementById('playerName').value||'').trim()||'Jogador'; const diff=(document.querySelector('input[name="diff"]:checked')||{}).value||'normal'; const speed=document.getElementById('speedSel').value||'medium'; CF.newGame(name,diff,speed); startGameUI(); }
  function openLoadList(){ const list=CF.listSaves(); const div=document.getElementById('saveList'); if(list.length===0){ div.innerHTML='<p class="muted">Nenhum jogo salvo.</p>'; } else { div.innerHTML=list.map(n=>`<div class="row"><span>${n}</span><button class="btn" data-load="${n}">Carregar</button></div>`).join(''); div.querySelectorAll('[data-load]').forEach(b=> b.addEventListener('click',()=>{ if(CF.loadByName(b.dataset.load)){ startGameUI(); CF.flash('Jogo carregado: '+b.dataset.load); document.getElementById('loadModal').classList.add('hidden'); } },{passive:true})); } document.getElementById('loadModal').classList.remove('hidden'); }
  window.addEventListener('DOMContentLoaded',()=>{ document.getElementById('btnNew').addEventListener('click',()=>{ newGame(); bindBasics(); }); document.getElementById('btnLoad').addEventListener('click',openLoadList); });
})();