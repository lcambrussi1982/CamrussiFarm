
(function(){
  const CF=window.CF, st=CF.state; const els=CF.els={};
  CF.q=(s)=>document.querySelector(s); CF.qq=(s)=>Array.from(document.querySelectorAll(s));
  CF.initEls=function(){
    els.app=CF.q('#app'); els.splash=CF.q('#splash'); els.money=CF.q('#money'); els.date=CF.q('#date'); els.clock=CF.q('#clock'); els.weather=CF.q('#weather'); els.hudName=CF.q('#hudName');
    els.field=CF.q('#field'); els.overlay=CF.q('#fieldOverlay'); els.plantPalette=CF.q('#plantPalette'); els.invList=CF.q('#invList'); els.machinesBar=CF.q('#machinesBar');
    els.harvestModal=CF.q('#harvestModal'); els.harvestInfo=CF.q('#harvestInfo'); els.centerModal=CF.q('#centerModal'); els.panelHost=CF.q('#panelHost');
  };
  CF.renderHUD=function(){
    els.money.textContent=Math.max(0,Math.round(st.money)); els.hudName.textContent=st.playerName||"—";
    els.date.textContent=`${String(st.day).padStart(2,'0')} ${CF.MONTHS[st.month]} • Ano ${st.year} • ${CF.currentSeason()}`;
    els.clock.textContent=`${String(st.hour).padStart(2,'0')}:${String(st.minute).padStart(2,'0')}`;
    els.weather.textContent=(st.weather==='rain'?'🌧 ':'')+(st.weather==='storm'?'⛈ ':'')+(CF.WEATHER[st.weather]||'');
    // HUD flutuante
    const df=CF.q('#hudDateFull'), cf=CF.q('#hudClockFull'), sf=CF.q('#hudSeasonFull'), wf=CF.q('#hudWeatherFull'), sp=CF.q('#hudSpeedFull');
    if(df) df.textContent = `${String(st.day).padStart(2,'0')} ${CF.MONTHS[st.month]} • Ano ${st.year}`;
    if(cf) cf.textContent = `${String(st.hour).padStart(2,'0')}:${String(st.minute).padStart(2,'0')}`;
    if(sf) sf.textContent = CF.currentSeason();
    if(wf) wf.textContent = CF.WEATHER[st.weather]||'';
    if(sp) sp.textContent = `Vel.: ${({slow:'Lento',medium:'Médio',fast:'Rápido'})[st.speedKey]}`;
    // overlay
    els.overlay.className = 'overlay ' + ((st.hour>=18||st.hour<6)?'night':'day') + (st.weather!=='clear'?' rain':'');
  };
  CF.buildField=function(){
    els.field.innerHTML="";
    for(let y=0;y<GRID_H;y++){ for(let x=0;x<GRID_W;x++){ const i=idx(x,y), t=st.tiles[i]; const div=document.createElement('div'); let cls='tile'; if(t.tilled) cls+=' tilled'; if(t.water>0) cls+=' wet'; if(t.locked) cls+=' locked'; if(t.crop&&t.crop.alive&&t.crop.stage>=CF.crops[t.crop.type].stages) cls+=' harvest'; if(t.crop&&t.crop.alive===false) cls+=' dead'; if(t.afflict){ if(t.afflict.type==='nutrient') cls+=' need-n'; if(t.afflict.type==='insect') cls+=' need-b'; if(t.afflict.type==='fungus') cls+=' need-f'; }
      div.className=cls; div.dataset.i=i;
      if(t.locked){ const c=document.createElement('div'); c.className='cost'; c.textContent='$'+CF.landDynamicPrice(); div.appendChild(c); }
      if(t.crop){ const d=CF.crops[t.crop.type]; const icon=(!t.crop.alive)?d.icons[0]:(t.crop.stage>=d.stages?d.icons[2]:d.icons[Math.min(t.crop.stage,1)]); const img=document.createElement('img'); img.src=icon; img.alt=d.name; img.className='icon'; div.appendChild(img); }
      els.field.appendChild(div); } }
  };
  CF.buildPlantPalette=function(){
    const pal=els.plantPalette; pal.innerHTML="";
    Object.keys(CF.crops).forEach(k=>{ const d=CF.crops[k]; const b=document.createElement('button'); b.className='crop-btn'; b.dataset.crop=k; b.innerHTML=`<img src="${d.icons[0]}" alt="${d.name}"/><span>${d.name} • $${d.seedCost}</span>`; b.addEventListener('click',()=>{ CF.qq('.crop-btn').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); st.selectedCrop=k; },{passive:true}); pal.appendChild(b); });
  };
  CF.renderInventory=function(){
    const inv=st.inventory; const lines=[['Silo (cap)', String(inv.silo*CF.SILO_CAPACITY)], ['Fertilizante (un)', String(inv.fert||0)], ['Inseticida (un)', String(inv.inseticida||0)], ['Fungicida (un)', String(inv.fungicida||0)], ...Object.keys(CF.crops).map(k=>[CF.crops[k].name+' (armazenado)', String(st.storage[k]||0)]), ...Object.keys(CF.crops).map(k=>[CF.crops[k].name+' (sementes)', String(st.seedStock[k]||0)])];
    CF.q('#invList').innerHTML = lines.map(([k,v])=> `<li>${k}: <b>${v}</b></li>`).join('');
  };
  CF.render=function(){ CF.renderHUD(); CF.buildField(); CF.renderInventory(); CF.renderMachines(); };
  CF.renderMachines=function(){
    const m=st.inventory; CF.q('#machinesBar').innerHTML=[['tractor','🚜','Trator'],['plow_basic','🛠️','Arado S.'],['plow_dual','🛠️','Arado D.'],['planter_3','🌱','Plant. 3L'],['planter_6','🌱','Plant. 6L'],['sprayer','🧪','Pulveriz.'],['harvester','🧺','Colheit.'],['truck','🚚','Caminhão'],].map(([k,e,l])=>`<span class="tag">${e} ${l}: <b>${m[k]||0}</b></span>`).join(' ');
  };
})();