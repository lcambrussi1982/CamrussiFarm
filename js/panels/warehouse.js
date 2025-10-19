// Armazém — vende estoque e mostra capacidade + atalho para expandir
window.WarehousePanel=(function(){
  const CF=window.CF, st=CF.state;

  function renderCapacity(wrap){
    const used=CF.capacityUsed(), max=CF.capacityMax();
    const pct = max? Math.round(used/max*100): 0;
    const price = CF.siloDynamicPrice();
    const cap = document.createElement('div');
    cap.className='panel glass';
    cap.innerHTML = `
      <h3>Capacidade do Armazém</h3>
      <div class="row">
        <label>Uso: <b>${used}</b> / <b>${max}</b> (${pct}%)</label>
        <div>
          <button class="btn" id="expandCap">Comprar Silo (+${CF.SILO_CAPACITY}) — $${price}</button>
        </div>
      </div>
    `;
    cap.querySelector('#expandCap').addEventListener('click', ()=>{
      const p=CF.siloDynamicPrice();
      if(st.money<p){ alert('Dinheiro insuficiente'); return; }
      CF.buyItem('silo'); CF.saveSlot(st.playerName);
      window.CF.openPanel('warehouse'); // re-render painel
      alert('Capacidade aumentada!');
    }, {passive:true});
    wrap.appendChild(cap);
  }

  function renderTable(wrap){
    const box=document.createElement('div');
    box.className='panel glass';
    box.innerHTML='<h3>Vender produtos armazenados</h3><div id="storeTable"></div>';
    wrap.appendChild(box);

    const tbl=box.querySelector('#storeTable');
    const rows=Object.keys(CF.crops).map(k=>{
      const have=st.storage[k]|0;
      const price=Math.max(st.prices[k]||CF.crops[k].sell, CF.sellFloor(k));
      return `<tr>
        <td>${CF.crops[k].name}</td>
        <td class="right">${have}</td>
        <td class="right">$ ${price}</td>
        <td class="right">
          <input type="number" min="1" max="${have}" value="${have}"
                 id="q_${k}" style="width:90px; padding:6px 8px; border-radius:8px; background:#0b1220; color:#e2e8f0; border:1px solid rgba(255,255,255,.12)">
        </td>
        <td class="right"><button class="btn" data-sell="${k}" ${have<=0?'disabled':''}>Vender</button></td>
      </tr>`;
    }).join('');

    tbl.innerHTML = `<table class="table">
      <thead><tr><th>Produto</th><th class="right">Estoque</th><th class="right">Preço</th><th class="right">Qtd</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    tbl.querySelectorAll('[data-sell]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const k=b.dataset.sell;
        const inp=tbl.querySelector('#q_'+k);
        let qty=parseInt((inp&&inp.value)||'0',10)||0;
        if(qty<=0){ alert('Qtd inválida'); return; }
        CF.sellFromStorage(k,qty);
        CF.saveSlot(st.playerName);
        alert('Venda realizada!');
        window.CF.openPanel('warehouse');
      }, {passive:true});
    });
  }

  function render(host){
    const wrap=document.createElement('div');
    host.appendChild(wrap);
    renderCapacity(wrap);   // <— NOVO topo com capacidade + comprar silo
    renderTable(wrap);
  }

  return { render };
})();
