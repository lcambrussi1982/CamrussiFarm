(function(){
  const CF = window.CF;

  // Getter de estado (evita capturar state antes dele existir)
  const S = ()=> window.CF.state;

  // Ledger
  function addTxn(kind, category, amount, note=""){
    const st = S(); if(!st) return;
    st.ledger.push({kind,category,amount:Math.round(amount),note,day:st.day,month:st.month,year:st.year});
    CF.markDirty && CF.markDirty();
  }
  const hasMachine = (key)=> { const st=S(); return st && (st.inventory[key]||0)>0; };

  // Armazém
  CF.capacityMax = ()=> { const st=S(); return st ? (st.inventory.silo||0) * CF.SILO_CAPACITY : 0; };
  CF.capacityUsed = ()=> { const st=S(); return st ? Object.values(st.storage).reduce((a,b)=> a + (b|0), 0) : 0; };
  CF.siloDynamicPrice = ()=> { const st=S(); const n = st? (st.inventory.silo||0) : 0; const base=120; return Math.round(base * Math.pow(1.18, Math.max(0,n))); };

  // Custos por ação
  function chargeAction(kind, qty=1){
    const st=S(); if(!st) return;
    let need=null;
    if(kind==='plow'||kind==='plant') need='tractor';
    if(kind==='harvest') need='harvester';
    if(kind==='toWarehousePerUnit'||kind==='directPerUnit') need='truck';
    if(kind==='spray') need='sprayer';

    const scheme=CF.ACTION_COSTS[kind];
    let unit = hasMachine(need) ? scheme.service : scheme.rent;

    if(kind==='plow'){
      if((st.inventory.plow_dual||0)>0) unit*=0.5;
      else if((st.inventory.plow_basic||0)>0) unit*=0.75;
    }
    if(kind==='plant'){
      if((st.inventory.planter_6||0)>0) unit*=0.5;
      else if((st.inventory.planter_3||0)>0) unit*=0.75;
    }

    const cost=Math.round(unit*Math.max(1,qty));
    if(cost>0){
      st.money-=cost;
      addTxn('expense', (hasMachine(need)?'Serviços':'Aluguel de Máquinas'), cost, `${kind} (${qty}u)`);
    }
  }

  function chargeSalesTax(gross){
    const st=S(); if(!st) return;
    const tax = Math.round(gross*CF.TAX_RATE);
    if(tax>0){
      st.money -= tax;
      addTxn('expense','Impostos',tax,'Imposto sobre venda');
    }
  }

  // Piso de preço — considera auto-compra (mais cara) para pior caso
  CF.requiredMinPrice = function(cropKey){
    const seed = CF.seedAutoPrice(cropKey);
    const costs = seed + CF.ACTION_COSTS.plow.rent + CF.ACTION_COSTS.plant.rent + CF.ACTION_COSTS.harvest.rent + CF.ACTION_COSTS.directPerUnit.rent;
    const target = costs * 1.10 + 1;
    const p = target / (1 - CF.TAX_RATE);
    return Math.max( CF.sellFloor(cropKey), Math.round(p) );
  };

  // Preços e clima
  CF.rollPrices=function(){
    const st=S(); if(!st) return;
    const season=CF.currentSeason();
    const vol=CF.DIFF[st.difficulty].priceVol;

    for(const k of Object.keys(CF.crops)){
      const base=CF.crops[k].sell;
      const inSeason=CF.crops[k].season.includes(season);
      const seasonFactor=inSeason? 1.10 : 0.95;
      const noise=1+(Math.random()*2-1)*vol;
      let v=Math.round(base*seasonFactor*noise);
      v = Math.max(v, CF.requiredMinPrice(k));
      st.prices[k]=v;
    }

    if(Math.random()<0.10){
      const keys=Object.keys(CF.crops);
      const p=keys[Math.floor(Math.random()*keys.length)];
      st.prices[p]=Math.max(CF.requiredMinPrice(p), Math.round(st.prices[p]*1.35));
    }
  };

  CF.rollWeather=function(first=false){
    const st=S(); if(!st) return;
    const r=Math.random();
    if(r<0.15) st.weather='storm';
    else if(r<0.40) st.weather='rain';
    else st.weather='clear';

    const r2=Math.random();
    if(r2<0.15) st.forecast='storm';
    else if(r2<0.40) st.forecast='rain';
    else st.forecast='clear';

    if(!first) CF.flash('Clima: '+(CF.WEATHER[st.weather]||''));
  };

  // Insumos — automático usa markup
  function applyChem(affType){
    const st=S(); if(!st) return false;
    const map={nutrient:'fert', insect:'inseticida', fungus:'fungicida'};
    const key=map[affType]; if(!key) return false;

    if((st.inventory[key]||0)<=0){
      const price=CF.chemAutoPrice(key);
      if(st.money<price){ CF.flash('Sem estoque e sem dinheiro para '+key); return false; }
      st.money-=price;
      addTxn('expense','Insumos',price,'Compra automática '+key);
      st.inventory[key]=(st.inventory[key]||0)+1;
    }
    st.inventory[key]-=1;
    chargeAction('spray',1);
    return true;
  }

  // Interação de campo
  CF.applyTool=function(i){
    const st=S(); if(!st) return;
    const t=st.tiles[i]; if(!t) return;

    if(t.locked){
      const price=CF.landDynamicPrice();
      if(st.money<price){ CF.flash('Dinheiro insuficiente para comprar terreno.'); return; }
      st.money-=price;
      addTxn('capex','Terreno',price,'Aquisição de lote');
      t.locked=false; st.owned[i]=true;
      CF.recalcCredit && CF.recalcCredit();
      CF.render && CF.render();
      return;
    }

    const tool=st.selectedTool;
    switch(tool){
      case 'hoe':
        chargeAction('plow');
        t.tilled=true;
        CF.flash('Parcela arada.');
        break;

      case 'plant': {
        if(!t.tilled){ CF.flash('Arar antes de plantar.'); return; }
        const c=st.selectedCrop, def=CF.crops[c];
        if((st.seedStock[c]||0)<=0){
          const price=CF.seedAutoPrice(c);
          if(st.money<price){ CF.flash('Sem sementes e sem dinheiro.'); return; }
          st.money-=price;
          addTxn('expense','Sementes',price,'Compra automática de '+def.name);
          st.seedStock[c]=(st.seedStock[c]||0)+1;
        }
        st.seedStock[c]-=1;
        t.crop={type:c,stage:0,daysDry:0,alive:true,wateredToday:false};
        chargeAction('plant');
        break;
      }

      case 'water':
        if(!t.crop){ CF.flash('Nada para regar.'); return; }
        t.water=2; t.crop.wateredToday=true;
        break;

      case 'treat':
        if(!t.crop){ CF.flash('Nada para tratar.'); return; }
        if(!t.afflict){ CF.flash('Sem pragas/deficiências.'); return; }
        if(applyChem(t.afflict.type)){ t.afflict=null; CF.flash('Tratado com sucesso.'); }
        break;

      case 'harvest': {
        if(!t.crop){ CF.flash('Nada para colher.'); return; }
        const d=CF.crops[t.crop.type];
        if(!t.crop.alive){ CF.flash('Planta morta.'); return; }
        if(t.crop.stage<d.stages){ CF.flash('Ainda não está pronto.'); return; }

        chargeAction('harvest');
        CF._lastHarvestTile=i;
        const priceNow=Math.max(st.prices[t.crop.type]||d.sell, CF.requiredMinPrice(t.crop.type));
        const el=document.querySelector('#harvestInfo');
        if(el) el.textContent=`${d.name} — Preço do dia: $${priceNow}`;
        CF.openModal && CF.openModal('harvestModal');
        return;
      }
    }
    CF.markDirty && CF.markDirty();
    CF.render && CF.render();
  };

  // Colheita → vender/armazenar
  CF.harvestSell=function(){
    const st=S(); if(!st) return;
    const i=CF._lastHarvestTile; if(i==null) return;
    const t=st.tiles[i]; const d=CF.crops[t.crop.type];
    const priceNow=Math.max(st.prices[t.crop.type]||d.sell, CF.requiredMinPrice(t.crop.type));
    const gross=priceNow;
    addTxn('income','Vendas (bruto)',gross,'Venda '+d.name);
    chargeAction('directPerUnit',1);
    chargeSalesTax(gross);
    st.money+=Math.max(0,gross);
    t.crop=null; t.tilled=false; t.water=0;
    CF.closeModal && CF.closeModal('harvestModal');
    CF.render && CF.render();
  };

  CF.harvestStore=function(){
    const st=S(); if(!st) return;
    const i=CF._lastHarvestTile; if(i==null) return;
    const t=st.tiles[i];

    const cap=CF.capacityMax();
    const used=CF.capacityUsed();
    if(used>=cap){ CF.flash('Sem espaço no armazém/silo.'); return; }

    st.storage[t.crop.type]=(st.storage[t.crop.type]||0)+1;
    chargeAction('toWarehousePerUnit',1);
    t.crop=null; t.tilled=false; t.water=0;
    CF.closeModal && CF.closeModal('harvestModal');
    CF.render && CF.render();
  };

  CF.sellFromStorage=function(k,qty){
    const st=S(); if(!st) return;
    const have=st.storage[k]|0;
    if(have<qty){ CF.flash('Estoque insuficiente.'); return; }
    const p=Math.max(st.prices[k]||CF.crops[k].sell, CF.requiredMinPrice(k));
    const gross=p*qty;
    addTxn('income','Vendas (bruto)',gross,'Venda '+CF.crops[k].name+' x'+qty);
    chargeAction('directPerUnit',qty);
    chargeSalesTax(gross);
    st.money+=Math.max(0,gross);
    st.storage[k]=(st.storage[k]|0)-qty;
    CF.render && CF.render();
  };

  // Compras rápidas (Loja = barato)
  CF.buyItem=function(item){
    const st=S(); if(!st) return;

    if(item==='silo'){
      const price = CF.siloDynamicPrice();
      if(st.money<price){ CF.flash('Dinheiro insuficiente.'); return; }
      st.money -= price;
      st.inventory.silo = (st.inventory.silo||0) + 1;
      addTxn('capex','Silo',price,`Expansão de silo (+${CF.SILO_CAPACITY} un)`);
      CF.flash('Capacidade aumentada!');
      CF.render && CF.render();
      return;
    }
    if(item==='fert'||item==='inseticida'||item==='fungicida'){
      const price=CF.chemShopPrice(item);
      if(st.money<price){ CF.flash('Dinheiro insuficiente.'); return; }
      st.money-=price;
      st.inventory[item]=(st.inventory[item]||0)+1;
      addTxn('expense','Insumos', price,'Compra em loja '+item);
      CF.render && CF.render();
      return;
    }
  };

  // Máquinas
  CF.buyMachine=function(key){
    const st=S(); if(!st) return;
    if(st.inventory[key]>0){ CF.flash('Você já possui.'); return; }
    const price=CF.machineDynamicPrice(key);
    if(st.money<price){ CF.flash('Dinheiro insuficiente.'); return; }
    st.money-=price;
    st.inventory[key]=1;
    addTxn('capex','Máquinas',price,'Compra de '+(CF.MACHINES[key]?.name||key));
    CF.render && CF.render();
  };

  // Banco
  CF.bankBorrow=function(v){
    const st=S(); if(!st) return;
    v=Math.max(0,Math.round(v|0));
    if(st.debt+v>st.creditLimit){ CF.flash('Acima do limite de crédito.'); return; }
    st.debt+=v; st.money+=v;
    addTxn('finance','Empréstimos',v,'Cambrussi Bank — crédito');
    CF.render && CF.render();
  };
  CF.bankRepay=function(v){
    const st=S(); if(!st) return;
    v=Math.max(0,Math.round(v|0));
    if(v>st.money) v=st.money;
    const pay=Math.min(v,st.debt);
    if(pay<=0){ CF.flash('Nada a pagar.'); return; }
    st.debt-=pay; st.money-=pay;
    addTxn('finance','Amortização',pay,'Cambrussi Bank — pagamento');
    CF.render && CF.render();
  };

  // UI util
  CF.openModal=(id)=> { const m=document.getElementById(id); if(m) m.classList.remove('hidden'); };
  CF.closeModal=(id)=> { const m=document.getElementById(id); if(m) m.classList.add('hidden'); };
  CF.flash=function(msg){
    const s=document.getElementById('status'); if(!s) return;
    s.textContent=msg; setTimeout(()=>{ if(s.textContent===msg) s.textContent=''; }, 2500);
  };

  CF.openPanel=function(panelKey){
    const host=document.getElementById('panelHost');
    const title=document.getElementById('modalTitle');
    if(!host||!title) return;
    host.innerHTML='';
    if(panelKey==='market') { title.textContent='Loja'; window.MarketPanel.render(host); }
    else if(panelKey==='warehouse'){ title.textContent='Armazém'; window.WarehousePanel.render(host); }
    else if(panelKey==='bank'){ title.textContent='Banco'; window.BankPanel.render(host); }
    else if(panelKey==='reports'){ title.textContent='Relatórios'; window.ReportsPanel.render(host); }
    CF.openModal('centerModal');
  };
  CF.closePanel=function(){ CF.closeModal('centerModal'); history.replaceState(null,'','#'); };

  // Tick do tempo
  CF.tick=function(){
    const st=S(); if(!st) return;
    st.minute+=10;
    if(st.minute>=60){ st.minute=0; st.hour++; }

    if(st.hour>=22){
      if(st.weather==='rain'){
        st.tiles.forEach(t=>{ if(!t.locked) t.water=Math.min(2,t.water+1); });
      } else if(st.weather==='storm'){
        st.tiles.forEach(t=>{ if(!t.locked) t.water=2; });
      }
      st.tiles.forEach(t=>{
        if(t.crop && t.crop.alive){
          if(t.water>0){
            t.crop.stage=Math.min(t.crop.stage+1, CF.crops[t.crop.type].stages);
            t.water--;
          } else {
            t.crop.daysDry++;
            if(t.crop.daysDry>2) t.crop.alive=false;
          }
          if(Math.random()<0.15 && !t.afflict){
            const kinds=CF.AFFLICTS;
            const pick=kinds[Math.floor(Math.random()*kinds.length)];
            t.afflict={type:pick, days:2};
          } else if(t.afflict){
            t.afflict.days--;
            if(t.afflict.days<=0) t.afflict=null;
          }
        }
      });

      if(st.day===30 && st.debt>0){
        const j=Math.round(st.debt*0.01);
        st.debt+=j; addTxn('expense','Juros',j,'Juros mês — Cambrussi Bank');
      }

      st.hour=6; st.day++;
      if(st.day>30){ st.day=1; st.month++; if(st.month>11){ st.month=0; st.year++; } }
      CF.rollPrices(); CF.rollWeather(); CF.recalcCredit && CF.recalcCredit();
    }
    CF.render && CF.render();
  };
})();
