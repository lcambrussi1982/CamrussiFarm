
window.ReportsPanel=(function(){
  const CF=window.CF, st=CF.state;
  function sum(list,kind,cat=null){ return list.filter(t=>t.kind===kind && (!cat || t.category===cat)).reduce((a,b)=>a+b.amount,0); }
  function render(host){
    const wrap=document.createElement('div'); wrap.className='panel glass';
    wrap.innerHTML = `<div class="row">
        <label>Período:</label>
        <label><input type="radio" name="period" value="mtd" checked/> Mês</label>
        <label><input type="radio" name="period" value="ytd"/> Ano</label>
        <label><input type="radio" name="period" value="all"/> Tudo</label>
      </div>
      <div id="dreTable"></div>
      <h4 style="margin-top:12px">Balanço de Gastos</h4>
      <div id="expenseTable"></div>
      <h4 style="margin-top:12px">Balanço Patrimonial</h4>
      <div id="balanceSheet"></div>`;
    host.appendChild(wrap);
    function renderTables(){
      const period=(wrap.querySelector('input[name="period"]:checked')||{value:'mtd'}).value;
      const list=st.ledger.filter(tx=>{ if(period==='all') return true; if(period==='ytd') return tx.year===st.year; return tx.month===st.month && tx.year===st.year; });
      const receitaBruta=sum(list,'income'), imposto=sum(list,'expense','Impostos'), sementes=sum(list,'expense','Sementes'), aluguel=sum(list,'expense','Aluguel de Máquinas'), servicos=sum(list,'expense','Serviços'), insumos=sum(list,'expense','Insumos');
      const receitaLiquida=receitaBruta - imposto; const custoOper=sementes+insumos+aluguel+servicos; const lucroOper=receitaLiquida - custoOper; const juros=sum(list,'expense','Juros')|0; const resultado=lucroOper - juros;
      wrap.querySelector('#dreTable').innerHTML=`<table class="table"><thead><tr><th>Conta</th><th class="right">Valor ($)</th></tr></thead><tbody>
        <tr><td>Receita Bruta de Vendas</td><td class="right">${receitaBruta.toFixed(0)}</td></tr>
        <tr><td>(-) Impostos sobre Vendas</td><td class="right">-${imposto.toFixed(0)}</td></tr>
        <tr><td>= <b>Receita Líquida</b></td><td class="right"><b>${receitaLiquida.toFixed(0)}</b></td></tr>
        <tr><td>(-) Sementes</td><td class="right">-${sementes.toFixed(0)}</td></tr>
        <tr><td>(-) Insumos</td><td class="right">-${insumos.toFixed(0)}</td></tr>
        <tr><td>(-) Aluguel de Máquinas</td><td class="right">-${aluguel.toFixed(0)}</td></tr>
        <tr><td>(-) Serviços</td><td class="right">-${servicos.toFixed(0)}</td></tr>
        <tr><td>= <b>Lucro Operacional</b></td><td class="right"><b>${lucroOper.toFixed(0)}</b></td></tr>
        <tr><td>(-) Despesa Financeira (Juros)</td><td class="right">-${juros.toFixed(0)}</td></tr>
      </tbody><tfoot><tr><td><b>Resultado do Período</b></td><td class="right"><b>${resultado.toFixed(0)}</b></td></tr></tfoot></table>`;
      const estoqueVal=Object.keys(st.storage).reduce((acc,k)=> acc+(st.storage[k]||0)*Math.max(st.prices[k]||CF.crops[k].sell, CF.sellFloor(k)),0);
      const terrasVal = st.owned.filter(v=>v).length * CF.landDynamicPrice();
      const maquinasVal = ['tractor','plow_basic','plow_dual','planter_3','planter_6','sprayer','harvester','truck'].reduce((a,k)=> a + (st.inventory[k]>0 ? CF.machineDynamicPrice(k):0), 0);
      const ativoCirculante=st.money+estoqueVal, ativoNaoCirculante=terrasVal+maquinasVal, ativoTotal=ativoCirculante+ativoNaoCirculante, passivo=Math.round(st.debt|0), patrimonio=ativoTotal-passivo;
      wrap.querySelector('#balanceSheet').innerHTML=`<table class="table"><thead><tr><th>Conta</th><th class="right">Valor ($)</th></tr></thead><tbody>
        <tr><td><b>Ativo Circulante</b></td><td class="right"></td></tr>
        <tr><td>&nbsp;&nbsp;Caixa</td><td class="right">$ ${st.money.toFixed(0)}</td></tr>
        <tr><td>&nbsp;&nbsp;Estoques (preço do dia)</td><td class="right">$ ${estoqueVal.toFixed(0)}</td></tr>
        <tr><td><b>Ativo Não Circulante</b></td><td class="right"></td></tr>
        <tr><td>&nbsp;&nbsp;Terras</td><td class="right">$ ${terrasVal.toFixed(0)}</td></tr>
        <tr><td>&nbsp;&nbsp;Máquinas</td><td class="right">$ ${maquinasVal.toFixed(0)}</td></tr>
      </tbody><tfoot><tr><td><b>Ativo Total</b></td><td class="right"><b>$ ${ativoTotal.toFixed(0)}</b></td></tr>
        <tr><td><b>Passivo (Dívida)</b></td><td class="right"><b>$ ${passivo.toFixed(0)}</b></td></tr>
        <tr><td><b>Patrimônio Líquido</b></td><td class="right"><b>$ ${patrimonio.toFixed(0)}</b></td></tr></tfoot></table>`;
      const gastoCats={}; list.forEach(t=>{ if(t.kind==='expense'){ gastoCats[t.category]=(gastoCats[t.category]||0)+(t.amount|0); } }); const totalG=Object.values(gastoCats).reduce((a,b)=>a+b,0);
      const rows=Object.entries(gastoCats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${k}</td><td class="right">$ ${v.toFixed(0)}</td><td>${totalG?Math.round(v/totalG*100):0}%</td></tr>`).join('');
      wrap.querySelector('#expenseTable').innerHTML=`<table class="table"><thead><tr><th>Categoria</th><th class="right">Total ($)</th><th>%</th></tr></thead><tbody>${rows||"<tr><td colspan='3'>Sem gastos.</td></tr>"}</tbody><tfoot><tr><td><b>Total</b></td><td class="right"><b>$ ${totalG.toFixed(0)}</b></td><td></td></tr></tfoot></table>`;
    }
    wrap.addEventListener('change',(e)=>{ if(e.target.name==='period') renderTables(); });
    renderTables();
  }
  return { render };
})();