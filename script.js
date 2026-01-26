document.addEventListener('DOMContentLoaded', () => {

  const elements = {
    calcular: document.getElementById("calcular"),
    dataInicio: document.getElementById("dataInicio"),
    inputInicial: document.getElementById("aporteInicial"),
    inputMensal: document.getElementById("aporteMensal"),
    inputTaxa: document.getElementById("taxa"),
    tipoTaxa: document.getElementById("tipoTaxa"),
    inputAnos: document.getElementById("anos"),
    tipoPeriodo: document.getElementById("tipoMesAno"),
    resultado: document.getElementById("resultado"),
    avisoIr: document.getElementById("avisoIr")
  };

  let grafico = null;

  function obterFeriados(ano) {
    return [
      `${ano}-01-01`, `${ano}-04-21`, `${ano}-05-01`, `${ano}-09-07`, 
      `${ano}-10-12`, `${ano}-11-02`, `${ano}-11-15`, `${ano}-11-20`, `${ano}-12-25`
    ];
  }

  function ehDiaUtil(data, feriados) {
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) return false;
    const stringData = data.toISOString().split('T')[0];
    return !feriados.includes(stringData);
  }

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

    obterTaxaDiaria(taxaDigitada, tipo) {
      let taxaAnual = tipo === "anual" 
        ? taxaDigitada / 100 
        : Math.pow(1 + (taxaDigitada / 100), 12) - 1;
      return Math.pow(1 + taxaAnual, 1 / 252) - 1;
    },

    simular(aporteInicial, aporteMensal, taxaDiaria, totalPeriodos, eMensal, dataPartida) {
      let saldo = aporteInicial;
      let totalInvestido = aporteInicial;
      let dataCronometro = new Date(dataPartida);
      let feriados = obterFeriados(dataCronometro.getFullYear());
      let resultados = [];

      const totalMeses = eMensal ? totalPeriodos : totalPeriodos * 12;

      for (let m = 1; m <= totalMeses; m++) {
        saldo += aporteMensal;
        totalInvestido += aporteMensal;

        const objetivo = new Date(dataCronometro);
        objetivo.setMonth(objetivo.getMonth() + 1);

        while (dataCronometro < objetivo) {
          const anoAtual = dataCronometro.getFullYear();

          if (!feriados[0].startsWith(anoAtual)) {
            feriados = obterFeriados(anoAtual);
          }

          if (ehDiaUtil(dataCronometro, feriados)) {
            saldo *= (1 + taxaDiaria);
          }
          dataCronometro.setDate(dataCronometro.getDate() + 1);
        }

        const deveRenderizar = eMensal || (m % 12 === 0);

        if (deveRenderizar) {
          const periodoExibicao = eMensal ? m : m / 12;
          resultados.push({
            periodo: periodoExibicao,
            mesesTotais: m,
            saldoBruto: saldo,
            totalInvestido: totalInvestido
          });
        }
      }
      return resultados;
    }
  };

  function renderizarCard(periodo, d, sufixo) {
    const lucroBruto = d.saldoBruto - d.totalInvestido;
    const aliquota = calculos.aliquotaIR(d.mesesTotais);
    const valorIR = lucroBruto * aliquota;
    const lucroLiquido = lucroBruto - valorIR;
    const saldoLiquido = d.saldoBruto - valorIR;

    const percentualLucro = (lucroLiquido / saldoLiquido) * 100;
    const percentualInvestido = 100 - percentualLucro;

    return `
      <div class="resultado">
        <h3>${periodo} ${sufixo}(s)</h3>
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
          <li><span>Total investido:</span> <strong>${formatarMoeda(d.totalInvestido)}</strong></li>
          <li><span>Saldo bruto:</span> <strong>${formatarMoeda(d.saldoBruto)}</strong></li>
          <hr>
          <li><span>Lucro bruto:</span> <strong>${formatarMoeda(lucroBruto)}</strong></li>
          <hr>
          <li class="ir-valor"><span>IR (${(aliquota * 100).toFixed(1)}%):</span> <strong>${formatarMoeda(valorIR)}</strong></li>
          <li class="lucro-valor"><span>Lucro líquido:</span> <strong>${formatarMoeda(lucroLiquido)}</strong></li>
          <li class="liquido-final"><span>Valor final líquido:</span> <strong>${formatarMoeda(saldoLiquido)}</strong></li>
        </ul>
        <div class="dica-performance">
          O lucro representa <strong>${percentualLucro.toFixed(2)}%</strong> do valor total.
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
    const tempoDigitado = Number(elements.inputAnos.value);
    const eMensal = elements.tipoPeriodo.value === "mensal";

    if ((aporteInicial <= 0 && aporteMensal <= 0) || taxaDigitada <= 0 || tempoDigitado <= 0) {
      elements.resultado.innerHTML = "<p>Preencha os valores corretamente.</p>";
      return;
    }

    const dataInicio = elements.dataInicio?.value 
      ? new Date(elements.dataInicio.value + 'T00:00:00') 
      : new Date();

    const taxaDiaria = calculos.obterTaxaDiaria(taxaDigitada, elements.tipoTaxa.value);
    const simulacao = calculos.simular(aporteInicial, aporteMensal, taxaDiaria, tempoDigitado, eMensal, dataInicio);

    elements.resultado.innerHTML = "";
    elements.avisoIr.style.display = "block";
    elements.avisoIr.innerHTML = `
      ⚠️ Os valores simulados incluem IR de acordo com o prazo:<br>
      - Até 180 dias: 22,5%<br>
      - 181 a 360 dias: 20%<br>
      - 361 a 720 dias: 17,5%<br>
      - Acima de 720 dias: 15%
    `;

    const labels = [];
    const dadosGrafico = [];
    const sufixo = eMensal ? "mês" : "ano";

    simulacao.forEach(res => {
      const lucroBruto = res.saldoBruto - res.totalInvestido;
      const valorIR = lucroBruto * calculos.aliquotaIR(res.mesesTotais);
      const saldoLiquido = res.saldoBruto - valorIR;

      labels.push(`${res.periodo} ${sufixo}(s)`);
      dadosGrafico.push(saldoLiquido);
      elements.resultado.innerHTML += renderizarCard(res.periodo, res, sufixo);
    });

    atualizarGrafico(labels, dadosGrafico);
    elements.resultado.scrollIntoView({ behavior: 'smooth' });
  });
});