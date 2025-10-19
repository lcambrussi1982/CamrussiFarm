
window.BankPanel=(function(){
  const CF=window.CF, st=CF.state;
  function render(host){
    const wrap=document.createElement('div'); wrap.className='panel glass';
    wrap.innerHTML = `<h3>Cambrussi Bank</h3>
      <div class="row"><label>Limite: $<span id="bankLimit">${st.creditLimit|0}</span> • Dívida: $<span id="bankDebt">${st.debt|0}</span></label></div>
      <div class="row"><input id="bankAmount" type="number" min="0" step="10" placeholder="Valor"/><button id="bankBorrow" class="btn">Emprestar</button><button id="bankRepay" class="btn ghost">Quitar</button></div>
      <p class="muted">Juros: 1% ao mês (lançado no fim de cada mês).</p>`;
    host.appendChild(wrap);
    wrap.querySelector('#bankBorrow').addEventListener('click',()=>{ const v=parseInt(wrap.querySelector('#bankAmount').value||'0',10)||0; CF.bankBorrow(v); CF.saveSlot(st.playerName); wrap.querySelector('#bankLimit').textContent=st.creditLimit|0; wrap.querySelector('#bankDebt').textContent=st.debt|0; },{passive:true});
    wrap.querySelector('#bankRepay').addEventListener('click',()=>{ let v=parseInt(wrap.querySelector('#bankAmount').value||'0',10)||0; CF.bankRepay(v); CF.saveSlot(st.playerName); wrap.querySelector('#bankLimit').textContent=st.creditLimit|0; wrap.querySelector('#bankDebt').textContent=st.debt|0; },{passive:true});
  }
  return { render };
})();