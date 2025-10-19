// Cambrussi Farm — Router SPA (abas Loja / Armazém / Banco / Relatórios)
// Navegação por hash (#market | #warehouse | #bank | #reports) + binds nos botões data-open

(function(){
  // Painéis válidos
  const PANELS = new Set(['market','warehouse','bank','reports']);

  // util para acessar CF sempre que existir
  const CF = ()=> window.CF || {};

  // Abre painel conforme rota
  function handleRoute(){
    const hash = (location.hash||'').replace('#','').trim().toLowerCase();
    if (PANELS.has(hash)) {
      CF().openPanel && CF().openPanel(hash);
    } else {
      // qualquer outro hash fecha painel central se aberto
      CF().closePanel && CF().closePanel();
    }
  }

  // Troca hash com segurança (sem duplicar entradas)
  function navigate(panelKey){
    if (!PANELS.has(panelKey)) return;
    if (location.hash !== '#'+panelKey) {
      location.hash = '#'+panelKey;
    } else {
      // se clicar na aba já ativa, apenas re-render (útil após compras)
      CF().openPanel && CF().openPanel(panelKey);
    }
  }

  // Liga botões da topnav (data-open="market" etc)
  function bindTopnav(){
    document.querySelectorAll('.topnav [data-open]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const key = (btn.getAttribute('data-open')||'').toLowerCase();
        navigate(key);
      }, {passive:true});
    });
  }

  // Binds genéricos de modal: [data-close="centerModal"], botão Voltar, ESC
  function bindModals(){
    // Fechar por atributo data-close
    document.addEventListener('click', (e)=>{
      const closer = e.target.closest('[data-close]');
      if(!closer) return;
      const id = closer.getAttribute('data-close');
      if(id==='centerModal'){
        history.replaceState(null,'','#'); // limpa hash
        CF().closePanel && CF().closePanel();
      } else {
        CF().closeModal && CF().closeModal(id);
      }
    }, {passive:true});

    // Botão "Voltar" dentro do modal central
    const back = document.getElementById('modalBack');
    if(back){
      back.addEventListener('click', ()=>{
        history.replaceState(null,'','#');
        CF().closePanel && CF().closePanel();
      }, {passive:true});
    }

    // ESC fecha modal central
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        history.replaceState(null,'','#');
        CF().closePanel && CF().closePanel();
      }
    });
  }

  // Destaca aba ativa (opcional visual)
  function highlightActive(){
    const active = (location.hash||'').replace('#','');
    document.querySelectorAll('.topnav [data-open]').forEach(btn=>{
      const k = btn.getAttribute('data-open');
      if(k===active) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  // Observa mudanças de hash
  window.addEventListener('hashchange', ()=>{
    handleRoute();
    highlightActive();
  });

  // Inicialização após DOM estar pronto
  document.addEventListener('DOMContentLoaded', ()=>{
    bindTopnav();
    bindModals();
    handleRoute();
    highlightActive();
  });
})();
