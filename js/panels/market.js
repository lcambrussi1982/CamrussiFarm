// Loja (Sementes, Insumos, Armazenagem/Silos, Máquinas) — Loja é mais barato que automático
window.MarketPanel = (function(){
  const CF=window.CF, st=CF.state;

  function btn(txt, attrs){ return `<button class="btn" ${attrs||''}>${txt}</button>`; }
  function row(label, right, btnHtml){ return `<div class="row"><label>${label}</label><div>${right||''} ${btnHtml||''}</div></div>`; }

  function renderSeeds(host){
    const wrap=document.createElement('div');
    wrap.className='panel glass';
    wrap.innerHTML='<h3>Comprar Sementes</h3>';
    Object.keys(CF.crops).forEach(k=>{
      const d=CF.crops[k];
      const shop = CF.seedShopPrice(k);
      const auto = CF.seedAutoPrice(k);
      const savePct = Math.round((auto - shop)/auto*100);
      const line=document.createElement('div');
      line.className='row';
      line.innerHTML=row(
        `${d.name} — <b>$${shop}</b> <span class="muted">(${savePct}% mais barato que automático)</span>`,
        '', btn('Comprar', `data-seed="${k}"`)
      );
      wrap.appendChild(line);
    });
    wrap.addEventListener('click', (e)=>{
      const b=e.target.closest('[data-seed]'); if(!b) return;
      const key=b.dataset.seed, c=CF.crops[key];
      const price=CF.seedShopPrice(key); // Loja (barato)
      if(st.money<price){ alert('Dinheiro insuficiente'); return; }
      st.money-=price;
      st.seedStock[key]=(st.seedStock[key]||0)+1;
      st.ledger.push({kind:'expense',category:'Sementes',amount:price,note:'Compra em loja '+c.name,day:st.day,month:st.month,year:st.year});
      CF.render(); CF.saveSlot(st.playerName);
      alert(`Comprou 1 semente de ${c.name} por $${price}`);
    }, {passive:true});
    host.appendChild(wrap);
  }

  function renderChems(host){
    const wrap=document.createElement('div');
    wrap.className='panel glass';
    wrap.innerHTML='<h3>Comprar Insumos</h3>';
    ['fert','inseticida','fungicida'].forEach(key=>{
      const shop=CF.chemShopPrice(key);
      const auto=CF.chemAutoPrice(key);
      const savePct=Math.round((auto-shop)/auto*100);
      const labelMap={fert:'Fertilizante', inseticida:'Inseticida', fungicida:'Fungicida'};
      wrap.innerHTML += row(
        `${labelMap[key]} — <b>$${shop}</b> <span class="muted">(${savePct}% mais barato que automático)</span>`,
        '', btn('Comprar',`data-buy="${key}"`)
      );
    });
    wrap.addEventListener('click', (e)=>{
      const b=e.target.closest('[data-buy]'); if(!b) return;
      const item=b.dataset.buy, price=CF.chemShopPrice(item);
      if(st.money<price){ alert('Dinheiro insuficiente'); return; }
      st.money-=price;
      st.inventory[item]=(st.inventory[item]||0)+1;
      st.ledger.push({kind:'expense',category:'Insumos',amount:price,note:'Compra em loja '+item,day:st.day,month:st.month,year:st.year});
      CF.render(); CF.saveSlot(st.playerName);
      alert(`Comprou ${item} por $${price}`);
    }, {passive:true});
    host.appendChild(wrap);
  }

  function renderStorage(host){
    const wrap=document.createElement('div');
    wrap.className='panel glass';
    const used = (window.CF.capacityUsed && CF.capacityUsed()) || 0;
    const max = (window.CF.capacityMax && CF.capacityMax()) || 0;
    const price = CF.siloDynamicPrice();
    wrap.innerHTML = `
      <h3>Armazenagem (Silos)</h3>
      <div class="row">
        <label>Capacidade: <b>${used}</b> / <b>${max}</b> unidades</label>
        <div class="muted">Cada silo +${CF.SILO_CAPACITY} un</div>
      </div>
      ${row(`Próximo silo: $${price}`, '', btn('Comprar Silo (+10 un)', 'id="buySilo"'))}
    `;
    wrap.querySelector('#buySilo').addEventListener('click', ()=>{
      const p=CF.siloDynamicPrice();
      if(st.money<p){ alert('Dinheiro insuficiente'); return; }
      window.CF.buyItem('silo'); CF.saveSlot(st.playerName);
      host.innerHTML=''; renderSeeds(host); renderChems(host); renderStorage(host); renderMachines(host);
      alert('Capacidade aumentada!');
    }, {passive:true});
    host.appendChild(wrap);
  }

  function renderMachines(host){
    const wrap=document.createElement('div');
    wrap.className='panel glass';
    wrap.innerHTML='<h3>Máquinas & Implementos</h3>';
    const order=['tractor','plow_basic','plow_dual','planter_3','planter_6','sprayer','harvester','truck'];
    order.forEach(k=>{
      const name=(CF.MACHINES[k]?.name)||k;
      const price=CF.machineDynamicPrice(k);
      const have=st.inventory[k]>0;
      const div=document.createElement('div'); div.className='row';
      div.innerHTML = row(`${name} — $${price} ${have?'• <b>Você já tem</b>':''}`, '', btn('Comprar',`data-mach="${k}" ${have?'disabled':''}`));
      wrap.appendChild(div);
    });
    wrap.addEventListener('click', (e)=>{
      const b=e.target.closest('[data-mach]'); if(!b) return;
      const key=b.dataset.mach; const price=CF.machineDynamicPrice(key);
      if(st.inventory[key]>0){ alert('Você já possui.'); return; }
      if(st.money<price){ alert('Dinheiro insuficiente'); return; }
      st.money-=price; st.inventory[key]=1;
      st.ledger.push({kind:'capex',category:'Máquinas',amount:price,note:'Compra '+(CF.MACHINES[key]?.name||key),day:st.day,month:st.month,year:st.year});
      CF.render(); CF.saveSlot(st.playerName);
      alert('Comprou '+(CF.MACHINES[key]?.name||key));
    }, {passive:true});
    host.appendChild(wrap);
  }

  function render(host){
    renderSeeds(host);
    renderChems(host);
    renderStorage(host);
    renderMachines(host);
  }
  return { render };
})();
