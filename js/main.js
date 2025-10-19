// Cambrussi Farm — Main bootstrap
// Liga início de jogo, salvar/carregar e ações de colheita/modais.

(function(){
  const CF = ()=> window.CF || {};

  function byId(id){ return document.getElementById(id); }

  function startNewGame(){
    const name = (byId('playerName')?.value || 'Fazendeiro').trim();
    const diff = (document.querySelector('input[name="diff"]:checked')?.value) || 'easy';
    const speed = (byId('speedSel')?.value) || 'medium';

    if (CF().newGame){
      CF().newGame({ name, difficulty: diff, speed });
    } else {
      // fallback mínimo: só troca telas se por algum motivo newGame não estiver disponível
      byId('splash')?.classList.add('hidden');
      byId('app')?.classList.remove('hidden');
      // cria estado mínimo se necessário
      window.CF.state = window.CF.state || {
        playerName: name, difficulty: diff, speed,
        money: 300, debt: 0, creditLimit: 0,
        hour: 6, minute: 0, day: 1, month: 0, year: 1,
        weather: 'clear', forecast: 'clear',
        tiles: [], owned: {}, storage: {}, prices: {},
        inventory: {}, seedStock: {}, ledger: []
      };
    }

    // Atualiza HUD
    if (CF().render) CF().render();
  }

  function openLoad(){
    // Preenche lista de saves se houver API; senão apenas abre modal
    const list = byId('saveList');
    if(list){ list.innerHTML = ''; }
    if (CF().listSaves && list){
      const saves = CF().listSaves();
      if(!saves || !saves.length){
        list.innerHTML = '<p class="muted">Sem jogos salvos.</p>';
      } else {
        list.innerHTML = saves.map(s=>`
          <div class="row">
            <div><b>${s.name}</b> • ${s.date}</div>
            <div>
              <button class="btn" data-load="${s.name}">Carregar</button>
              <button class="btn ghost" data-del="${s.name}">Apagar</button>
            </div>
          </div>`).join('');
        list.addEventListener('click', (e)=>{
          const bLoad = e.target.closest('[data-load]');
          const bDel  = e.target.closest('[data-del]');
          if(bLoad){ CF().loadSlot && CF().loadSlot(bLoad.getAttribute('data-load')); CF().closeModal('loadModal'); }
          if(bDel){  CF().deleteSlot && CF().deleteSlot(bDel.getAttribute('data-del')); openLoad(); }
        }, {passive:true});
      }
    }
    CF().openModal && CF().openModal('loadModal');
  }

  function bindGlobal(){
    // Splash: Novo / Carregar
    byId('btnNew')?.addEventListener('click', startNewGame, {passive:true});
    byId('btnLoad')?.addEventListener('click', openLoad, {passive:true});

    // Barra: Salvar / Carregar
    byId('btnSave')?.addEventListener('click', ()=>{
      const st = CF().state;
      if(CF().saveSlot && st){ CF().saveSlot(st.playerName || 'auto'); CF().flash && CF().flash('Jogo salvo.'); }
    }, {passive:true});
    byId('btnLoad2')?.addEventListener('click', openLoad, {passive:true});

    // Colheita: vender / armazenar
    byId('sellNow')?.addEventListener('click', ()=> CF().harvestSell && CF().harvestSell(), {passive:true});
    byId('storeNow')?.addEventListener('click', ()=> CF().harvestStore && CF().harvestStore(), {passive:true});

    // Fechar modal de colheita por X (atributo data-close já está no HTML; router cuida)
  }

  // Arranque do relógio quando o jogo começar (se state existir)
  function ensureClock(){
    if(!CF().tick) return;
    // Evita mais de um intervalo
    if (window.__cf_clock) clearInterval(window.__cf_clock);
    const st = CF().state || {};
    const speeds = CF().SPEEDS || { medium: 30 };
    const ms = (speeds[st.speed] || speeds.medium) * 1000;

    window.__cf_clock = setInterval(()=> CF().tick && CF().tick(), ms);
  }

  // Quando o jogo inicializa (após state.js configurar), chamamos render e o relógio
  function waitForStateAndInit(){
    const ready = !!(CF().state && CF().render && CF().tick);
    if(ready){
      // garante HUD inicial
      CF().rollPrices && CF().rollPrices();
      CF().rollWeather && CF().rollWeather(true);
      CF().render();
      ensureClock();
      return;
    }
    // tenta novamente logo
    setTimeout(waitForStateAndInit, 60);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    bindGlobal();
    waitForStateAndInit();
  });
})();
