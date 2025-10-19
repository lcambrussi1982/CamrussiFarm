
(function(){
  const CF=window.CF;
  function openFromHash(){
    const h=location.hash.replace('#','').trim();
    if(!h) return;
    if(['market','warehouse','bank','reports'].includes(h)){
      CF.openPanel(h);
    }
  }
  window.addEventListener('hashchange', openFromHash);
  window.Router={ open:(key)=>{ history.replaceState(null,'','#'+key); CF.openPanel(key); }, close:()=>{ CF.closePanel(); } };
})();