document.addEventListener('DOMContentLoaded', () => {
  const calcular = document.getElementById("calcular");
  const inputAporte = document.getElementById("aporte");
  const inputTaxa = document.getElementById("taxa");
  const inputAnos = document.getElementById("anos");
  const resultado = document.getElementById("resultado");
  const avisoIr = document.getElementById("avisoIr");

  let grafico = null;

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function aliquotaIR(meses) {
    if (meses <= 6) return 0.225;
    if (meses <= 12) return 0.20;
    if (meses <= 24) return 0.175;
    return 0.15;
  }

  function calcularResultado(aporte, taxaMensal, meses) {
    let saldo = 0;

    for (let i = 0; i < meses; i++) {
      saldo += aporte;
      saldo *= (1 + taxaMensal);
    }

    const totalInvestido = aporte * meses;
    const lucroBruto = saldo - totalInvestido;
    const aliquota = aliquotaIR(meses);
    const valorIR = lucroBruto * aliquota;

    return {
      totalInvestido,
      saldoBruto: saldo,
      lucroBruto,
      lucroMensal: lucroBruto / 12,
      aliquota,
      valorIR,
      lucroLiquido: lucroBruto - valorIR,
      saldoLiquido: saldo - valorIR
    };
  }

  function renderResultado(anos, dados) {
    return `
      <div class="resultado">
        <h3>${anos} ano(s)</h3>
        <p>Total investido: <strong>${formatarMoeda(dados.totalInvestido)}</strong></p>
        <p>Saldo final bruto: <strong>${formatarMoeda(dados.saldoBruto)}</strong></p>

        <hr>

        <p>Lucro bruto no período: <strong>${formatarMoeda(dados.lucroBruto)}</strong></p>
        <p>Lucro mensal médio: <strong>${formatarMoeda(dados.lucroMensal)}</strong></p>

        <hr>

        <p class="ir-valor">
          IR (${(dados.aliquota * 100).toFixed(1)}%): <strong>${formatarMoeda(dados.valorIR)}</strong>
        </p>

        <p class="lucro-valor">
          Lucro líquido: <strong>${formatarMoeda(dados.lucroLiquido)}</strong>
        </p>

        <p>Valor final líquido: <strong>${formatarMoeda(dados.saldoLiquido)}</strong></p>
      </div>
    `;
  }

  function criarGrafico(labels, dados) {
    const ctx = document.getElementById("graficoPatrimonio").getContext("2d");

    if (grafico) {
      grafico.destroy();
    }

    grafico = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Evolução do patrimônio (líquido)",
          data: dados,
          borderColor: "#ffffffff",
          backgroundColor: "#0b774aff",
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            ticks: {
              callback: value => formatarMoeda(value)
            }
          }
        }
      }
    });
  }

  calcular.addEventListener('click', () => {
    const aporte = Number(inputAporte.value);
    const taxaMensal = Number(inputTaxa.value) / 100;
    const anosTotais = Number(inputAnos.value);

    resultado.innerHTML = "";

    if (aporte <= 0 || taxaMensal <= 0 || anosTotais <= 0) {
      resultado.innerHTML = "<strong>Preencha os valores corretamente.</strong>";
      avisoIr.style.display = "none";
      return;
    }

    avisoIr.style.display="block";
    avisoIr.innerHTML= `
      ⚠️ Os valores simulados incluem IR de acordo com o prazo:<br>
      - Até 180 dias: 22,5%<br>
      - 181 a 360 dias: 20%<br>
      - 361 a 720 dias: 17,5%<br>
      - Acima de 720 dias: 15%
    `;

    const labels = [];
    const dadosGrafico = [];

    for (let anoAtual = 1; anoAtual <= anosTotais; anoAtual++) {
      const meses = anoAtual * 12;
      const dados = calcularResultado(aporte, taxaMensal, meses);

      labels.push(`${anoAtual} ano(s)`);
      dadosGrafico.push(dados.saldoLiquido);

      resultado.innerHTML += renderResultado(anoAtual, dados);
    }

    const graficoCanvas = document.getElementById("graficoPatrimonio");
    graficoCanvas.style.display = "block";

    criarGrafico(labels, dadosGrafico);
  });
});