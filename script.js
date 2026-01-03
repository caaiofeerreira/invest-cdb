document.addEventListener('DOMContentLoaded', () => {

  const elements = {
    calcular: document.getElementById("calcular"),
    inputInicial: document.getElementById("aporteInicial"),
    inputMensal: document.getElementById("aporteMensal"),
    inputTaxa: document.getElementById("taxa"),
    tipoTaxa: document.getElementById("tipoTaxa"),
    inputAnos: document.getElementById("anos"),
    resultado: document.getElementById("resultado"),
    avisoIr: document.getElementById("avisoIr")
  };

  let grafico = null;

  const formatarMoeda = (valor) => 
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function mascaraFinanceira(valor) {
    const limpo = valor.replace(/\D/g, "");
    if (!limpo) return "";
    return (Number(limpo) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function converterParaNumero(stringBR) {
    if (!stringBR) return 0;
    return Number(stringBR.replace(/\./g, "").replace(",", "."));
  }

  const calculos = {
    aliquotaIR(meses) {
      if (meses <= 6) return 0.225;
      if (meses <= 12) return 0.20;
      if (meses <= 24) return 0.175;
      return 0.15;
    },

    investimento(aporteInicial, aporteMensal, taxaMensal, meses) {
      let saldo = aporteInicial;
      let totalInvestido = aporteInicial;

      for (let i = 0; i < meses; i++) {
        saldo += aporteMensal;
        totalInvestido += aporteMensal;
        saldo *= (1 + taxaMensal);
      }
      return { saldo, totalInvestido };
    },

    converterTaxaMensal(taxaDigitada, tipo) {
      const taxaDecimal = taxaDigitada / 100;
      return tipo === "anual" 
        ? Math.pow(1 + taxaDecimal, 1 / 12) - 1 
        : taxaDecimal;
    }
  };

  function renderizarCard(ano, d) {
    // Cálculo da proporção visual
    const percentualLucro = (d.lucroLiquido / d.saldoLiquido) * 100;
    const percentualInvestido = 100 - percentualLucro;

    return `
      <div class="resultado">
        <h3>${ano} ano(s)</h3>
        
        <div class="barra-container">
          <div class="barra-progresso">
            <div class="parte-investida" style="width: ${percentualInvestido}%"></div>
            <div class="parte-lucro" style="width: ${percentualLucro}%"></div>
          </div>
          <div class="legenda-barra">
            <span><small>●</small> Investido</span>
            <span><small>●</small> Lucro</span>
          </div>
        </div>

        <ul class="lista-resultado">
          <li>
            <span>Total investido:</span>
            <strong>${formatarMoeda(d.totalInvestido)}</strong>
          </li>
          <li>
            <span>Saldo bruto:</span>
            <strong>${formatarMoeda(d.saldoBruto)}</strong>
          </li>
          <hr>
          <li>
            <span>Lucro bruto:</span>
            <strong>${formatarMoeda(d.lucroBruto)}</strong>
          </li>
          <hr>
          <li class="ir-valor">
            <span>IR (${(d.aliquota * 100).toFixed(1)}%):</span>
            <strong>${formatarMoeda(d.valorIR)}</strong>
          </li>
          <li class="lucro-valor">
            <span>Lucro líquido:</span>
            <strong>${formatarMoeda(d.lucroLiquido)}</strong>
          </li>
          <li class="liquido-final">
            <span>Valor final líquido:</span>
            <strong>${formatarMoeda(d.saldoLiquido)}</strong>
          </li>
        </ul>

        <div class="dica-performance">
          O lucro representa <strong>${percentualLucro.toFixed(1)}%</strong> do valor total.
        </div>
      </div>
    `;
  }

  function atualizarGrafico(labels, dados) {
    const ctx = document.getElementById("graficoPatrimonio").getContext("2d");
    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Patrimônio Líquido",
          data: dados,
          backgroundColor: "#0b774aff"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { ticks: { callback: v => formatarMoeda(v) } } }
      }
    });
  }

  [elements.inputInicial, elements.inputMensal, elements.inputTaxa].forEach(input => {
    input.addEventListener("input", (e) => {
      e.target.value = mascaraFinanceira(e.target.value);
    });
  });

  elements.calcular.addEventListener("click", () => {
    const aporteInicial = converterParaNumero(elements.inputInicial.value);
    const aporteMensal = converterParaNumero(elements.inputMensal.value);
    const taxaDigitada = converterParaNumero(elements.inputTaxa.value);
    const anosTotais = Number(elements.inputAnos.value);

    if ((aporteInicial <= 0 && aporteMensal <= 0) || taxaDigitada <= 0 || anosTotais <= 0) {
      elements.resultado.innerHTML = "<p>Preencha os valores corretamente.</p>";
      return;
    }

    const taxaMensal = calculos.converterTaxaMensal(taxaDigitada, elements.tipoTaxa.value);

    avisoIr.style.display = "block";
    avisoIr.innerHTML = `
      ⚠️ Os valores simulados incluem IR de acordo com o prazo:<br>
      - Até 180 dias: 22,5%<br>
      - 181 a 360 dias: 20%<br>
      - 361 a 720 dias: 17,5%<br>
      - Acima de 720 dias: 15%
    `;
    
    elements.resultado.innerHTML = "";
    elements.avisoIr.style.display = "block";

    const labels = [];
    const dadosGrafico = [];

    for (let ano = 1; ano <= anosTotais; ano++) {
      const meses = ano * 12;
      const res = calculos.investimento(aporteInicial, aporteMensal, taxaMensal, meses);
      
      const lucroBruto = res.saldo - res.totalInvestido;
      const aliquota = calculos.aliquotaIR(meses);
      const valorIR = lucroBruto * aliquota;

      const dadosView = {
        ...res,
        saldoBruto: res.saldo,
        lucroBruto,
        aliquota,
        valorIR,
        lucroLiquido: lucroBruto - valorIR,
        saldoLiquido: res.saldo - valorIR
      };

      labels.push(`${ano} ano(s)`);
      dadosGrafico.push(dadosView.saldoLiquido);
      elements.resultado.innerHTML += renderizarCard(ano, dadosView);
    }

    atualizarGrafico(labels, dadosGrafico);
    elements.resultado.scrollIntoView({ behavior: 'smooth' });
  });
});