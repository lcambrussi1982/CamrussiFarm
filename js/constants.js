window.CF = window.CF || {};
(function(){
  const CF = window.CF;

  // Velocidade do dia (s)
  CF.SPEEDS = { slow: 45, medium: 30, fast: 18 };

  // Calendário
  CF.MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  CF.SEASONS = ["Verão","Outono","Inverno","Primavera"];
  window.GRID_W=12; window.GRID_H=10; window.idx=(x,y)=>y*GRID_W+x;

  // === Política de preços Loja x Automático ===
  // Loja = preço base (mais barato). Automático = base com leve acréscimo.
  CF.AUTO_MARKUP = { seed: 0.12, chem: 0.10 }; // +12% semente / +10% insumo no automático

  // === ECONOMIA BALANCEADA (lucro mínimo mesmo alugando) ===
  CF.crops = {
    trigo:  {name:"Trigo",   seedCost:3, stages:2, sell:18, grow:1.0, season:["Primavera","Outono"], icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/trigo_final.svg"]},
    milho:  {name:"Milho",   seedCost:5, stages:2, sell:26, grow:0.85, season:["Verão"],               icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/milho_final.svg"]},
    cenoura:{name:"Cenoura", seedCost:4, stages:2, sell:21, grow:0.98, season:["Inverno","Primavera"],  icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/cenoura_final.svg"]},
    tomate: {name:"Tomate",  seedCost:6, stages:2, sell:26, grow:0.9,  season:["Verão","Outono"],       icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/tomate_final.svg"]},
    batata: {name:"Batata",  seedCost:5, stages:2, sell:24, grow:0.95, season:["Outono","Inverno"],     icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/batata_final.svg"]},
    arroz:  {name:"Arroz",   seedCost:4, stages:2, sell:20, grow:0.98, season:["Primavera","Verão"],    icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/arroz_final.svg"]},
    cana:   {name:"Cana",    seedCost:7, stages:2, sell:31, grow:0.8,  season:["Verão"],                icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/cana_final.svg"]},
    cafe:   {name:"Café",    seedCost:8, stages:2, sell:40, grow:0.7,  season:["Primavera","Outono"],   icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/cafe_final.svg"]},
  };

  // Capacidade por silo
  CF.SILO_CAPACITY = 10;

  // Imposto sobre venda
  CF.TAX_RATE = 0.08;

  // Custos operacionais (garantem lucro mínimo)
  CF.ACTION_COSTS = {
    plow:{rent:6,  service:2},
    plant:{rent:5, service:1.5},
    harvest:{rent:7, service:2.5},
    toWarehousePerUnit:{rent:1.4, service:0.6},
    directPerUnit:{rent:2.2, service:0.9},
    spray:{rent:6, service:2}
  };

  // Máquinas (preço dinâmico baseado no café)
  CF.machineMultipliers = { tractor:40, truck:60, harvester:100, sprayer:45, plow_basic:10, plow_dual:18, planter_3:20, planter_6:35 };
  CF.MACHINES = {
    tractor:{name:"Trator", price:0}, plow_basic:{name:"Arado Simples", price:0}, plow_dual:{name:"Arado Duplo", price:0},
    planter_3:{name:"Plantadeira 3 linhas", price:0}, planter_6:{name:"Plantadeira 6 linhas", price:0},
    sprayer:{name:"Pulverizador", price:0}, harvester:{name:"Colheitadeira", price:0}, truck:{name:"Caminhão", price:0},
  };

  // Insumos (preço de LOJA; automático tem markup)
  CF.CHEM_PRICES = { fert:3, inseticida:5, fungicida:6 };

  CF.AFFLICTS = ['nutrient','insect','fungus'];
  CF.WEATHER = { clear:'Céu limpo', rain:'Chuva leve', storm:'Chuva forte' };
  CF.SAVE_PREFIX = "cambrussi_farm_v13_";

  // Piso mínimo por cultura
  CF.sellFloor = (k)=> Math.max(1, Math.round(CF.crops[k].sell*0.75));

  // === Helpers de preço Loja x Automático ===
  CF.seedShopPrice = (k)=> CF.crops[k].seedCost;
  CF.seedAutoPrice = (k)=> Math.round(CF.seedShopPrice(k) * (1 + CF.AUTO_MARKUP.seed));
  CF.chemShopPrice = (key)=> CF.CHEM_PRICES[key];
  CF.chemAutoPrice = (key)=> Math.round(CF.chemShopPrice(key) * (1 + CF.AUTO_MARKUP.chem));

  // Estação atual
  CF.currentSeason = function(){ const m=CF.state.month; return CF.SEASONS[Math.floor(((m%12)+12)%12/3)]; };

  // Preço dinâmico da terra ≈ 300× preço do café do dia
  CF.landDynamicPrice = function(){
    const cafeFloor = CF.sellFloor('cafe');
    const cafeToday = (CF.state.prices && CF.state.prices['cafe']) ? CF.state.prices['cafe'] : cafeFloor;
    return Math.max(1, Math.round(cafeToday * 300));
  };
  // Preço dinâmico de máquina (ancorado no café)
  CF.machineDynamicPrice = function(key){
    const cafeFloor = CF.sellFloor('cafe');
    const cafeToday = (CF.state.prices && CF.state.prices['cafe']) ? CF.state.prices['cafe'] : cafeFloor;
    const mult = CF.machineMultipliers[key] || 50;
    return Math.max(1, Math.round(cafeToday * mult));
  };

  // Dificuldades
  CF.DIFF = {
    easy:  { startMoney:420, priceVol:0.10, startOwned:12 },
    normal:{ startMoney:280, priceVol:0.14, startOwned:8  },
    hard:  { startMoney:200, priceVol:0.18, startOwned:6  }
  };
})();
