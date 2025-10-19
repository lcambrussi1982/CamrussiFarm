
(function(){
  const CF=window.CF; const st=CF.state = {
    playerName:"", difficulty:"normal", speedKey:"medium", dayLenSec:30,
    day:1, month:0, year:1, hour:6, minute:0,
    money:0, debt:0, creditLimit:0,
    tiles:[], owned:[],
    inventory:{ fert:0, inseticida:0, fungicida:0, silo:1, tractor:0, sprayer:0, harvester:0, truck:0, plow_basic:0, plow_dual:0, planter_3:0, planter_6:0 },
    seedStock:{ trigo:0, milho:0, cenoura:0, tomate:0, batata:0, arroz:0, cana:0, cafe:0 },
    storage:{ trigo:0, milho:0, cenoura:0, tomate:0, batata:0, arroz:0, cana:0, cafe:0 },
    prices:{}, ledger:[],
    selectedTool:"hoe", selectedCrop:"trigo",
    weather:'clear', forecast:'clear',
    timer:null, dirty:false, autosaveTimer:null,
  };
  function makeTile(){ return { tilled:false, water:0, crop:null, afflict:null, locked:true }; }
  function makeInitialOwned(diff){ let n=CF.DIFF[diff].startOwned|0; const a=Array.from({length:GRID_W*GRID_H},()=>false); let i=0; for(let y=0;y<GRID_H;y++){ for(let x=0;x<GRID_W;x++){ if(i<n){ a[idx(x,y)]=true; i++; } } } return a; }

  CF.markDirty=function(){ try{ st.dirty=true; }catch(e){} };
  CF.startAutoSave=function(){
    try{ if(st.autosaveTimer) clearInterval(st.autosaveTimer);
      st.autosaveTimer = setInterval(()=>{ if(st.playerName && st.dirty){ CF.saveSlot(st.playerName); } }, 4000);
    }catch(e){}
  };

  CF.recalcCredit=function(){ const owned=(st.owned||[]).filter(v=>v).length; st.creditLimit=Math.round(owned*CF.landDynamicPrice()*0.4); };

  CF.newGame=function(name,diff,speed){
    st.playerName=name||"Jogador"; st.difficulty=diff||"normal"; st.speedKey=speed||"medium"; st.dayLenSec=CF.SPEEDS[st.speedKey];
    st.day=1; st.month=0; st.year=1; st.hour=6; st.minute=0;
    st.money=CF.DIFF[st.difficulty].startMoney; st.debt=0;
    st.tiles = Array.from({length:GRID_W*GRID_H}, makeTile);
    st.owned = makeInitialOwned(st.difficulty); st.tiles.forEach((t,i)=> t.locked=!st.owned[i]);
    st.ledger=[]; st.prices={}; st.weather='clear'; st.forecast='clear';
    CF.rollPrices(); CF.rollWeather(true); CF.recalcCredit(); CF.saveSlot(st.playerName); CF.startAutoSave();
  };

  CF.saveSlot=function(name){ const key=CF.SAVE_PREFIX+(name||st.playerName||'Jogador'); localStorage.setItem(key, JSON.stringify(st)); st.dirty=false; };
  CF.listSaves=function(){ const out=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.startsWith(CF.SAVE_PREFIX)) out.push(k.replace(CF.SAVE_PREFIX,'')); } return out.sort(); };
  CF.loadByName=function(name){
    const raw=localStorage.getItem(CF.SAVE_PREFIX+name); if(!raw) return false;
    try{ const s=JSON.parse(raw); Object.assign(st,s);
      if(!Array.isArray(st.tiles)||st.tiles.length!==GRID_W*GRID_H) st.tiles=Array.from({length:GRID_W*GRID_H},makeTile);
      if(!Array.isArray(st.owned)||st.owned.length!==GRID_W*GRID_H) st.owned=makeInitialOwned(st.difficulty);
      st.tiles.forEach((t,i)=> t.locked=!st.owned[i]); st.dayLenSec=CF.SPEEDS[st.speedKey||'medium']; CF.recalcCredit(); CF.startAutoSave(); return true;
    }catch(e){ console.error(e); return false; }
  };
})();