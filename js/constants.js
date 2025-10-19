window.CF = window.CF || {};
(function(){
  const CF = window.CF;

  // Velocidade do dia (s)
  CF.SPEEDS = { slow: 45, medium: 30, fast: 18 };

  // Calendário
  CF.MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  CF.SEASONS = ["Verão","Outono","Inverno","Primavera"];
  window.GRID_W=12; window.GRID_H=10; window.idx=(x,y)=>y*GRID_W+x;

  // === ECONOMIA BALANCEADA para lucro mínimo mesmo com aluguel ===
  // - Preços de venda ↑ ~15–20%
  // - Sementes ↓ 1 crédito (facilita early-game)
  // - Imposto ↓ para 8%
  // - Custos de serviço/aluguel ↓
  CF.crops = {
    trigo:  {name:"Trigo",   seedCost:3, stages:2, sell:18, grow:1.0, season:["Primavera","Outono"], icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/trigo_final.svg"]},
    milho:  {name:"Milho",   seedCost:5, stages:2, sell:26, grow:0.85, season:["Verão"],               icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/milho_final.svg"]},
    cenoura:{name:"Cenoura", seedCost:4, stages:2, sell:21, grow:0.98, season:["Inverno","Primavera"],  icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/cenoura_final.svg"]},
    tomate: {name:"Tomate",  seedCost:6, stages:2, sell:26, grow:0.9,  season:["Verão","Outono"],       icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/tomate_final.svg"]},
    batata: {name:"Batata",  seedCost:5, stages:2, sell:24, grow:0.95, season:["Outono","Inverno"],     icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/batata_final.svg"]},
    arroz:  {name:"Arroz",   seedCost:4, stages:2, sell:20, grow:0.98, season:["Primavera","Verão"],    icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/arroz_final.svg"]},
    cana:   {name:"Cana",    seedCost:7, stages:2, sell:31, grow:0.8,  season:["Verão"],               icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/cana_final.svg"]},
    cafe:   {name:"Café",    seedCost:8, stages:2, sell:40, grow:0.7,  season:["Primavera","Outono"],  icons:["assets/icons/stage_seedling.svg","assets/icons/stage_leaf.svg","assets/icons/cafe_final.svg"]},
  };

  // Capacidade padrão (por silo)
  CF.SILO_CAPACITY = 10;

  // Imposto sobre venda ↓
  CF.TAX_RATE = 0.08;

  // Custos operacionais — queda geral p/ assegurar lucro mesmo alugando
  CF.ACTION_COSTS = {
    plow:{rent:6,  service:2},     // antes 10 / 3
    plant:{rent:5, service:1.5},   // antes 8 / 2
    harvest:{rent:7, service:2.5}, // antes 12 / 4
    toWarehousePerUnit:{rent:1.4, service:0.6}, // antes 2.0 / 0.8
    directPerUnit:{rent:2.2, service:0.9},      // antes 3.5 / 1.2
    spray:{rent:6, service:2}      // antes 9 / 3
  };

  // Máquinas (preço dinâmico baseado no café)
  CF.machineMultipliers = { tractor:40, truck:60, harvester:100, sprayer:45, plow_basic:10, plow_dual:18, planter_3:20, planter_6:35 };
  CF.MACHINES = {
    tractor:{name:"Trator", price:0}, plow_basic:{name:"Arado Simples", price:0}, plow_dual:{name:"Arado Duplo", price:0},
    planter_3:{name:"Plantadeira 3 linhas", price:0}, planter_6:{name:"Plantadeira 6 linhas", price:0},
    sprayer:{name:"Pulverizador", price:0}, harvester:{name:"Colheitadeira", price:0}, truck:{name:"Caminhão", price:0},
  };

  // Insumos ↓
  CF.CHEM_PRICES = { fert:3, inseticida:5, fungicida:6 };

  CF.AFFLICTS = ['nutrient','insect','fungus'];
  CF.WEATHER = { clear:'Céu limpo', rain:'Chuva leve', storm:'Chuva forte' };
  CF.SAVE_PREFIX = "cambrussi_farm_v13_";

  // Piso mínimo (↑) para preços dinâmicos do dia
  CF.sellFloor = (k)=> Math.max(1, Math.round(CF.crops[k].sell*0.75));

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

  // Dificuldades — vol reduzida (preço menos caótico)
  CF.DIFF = {
    easy:  { startMoney:420, priceVol:0.10, startOwned:12 },
    normal:{ startMoney:280, priceVol:0.14, startOwned:8  },
    hard:  { startMoney:200, priceVol:0.18, startOwned:6  }
  };
})();
