document.addEventListener('DOMContentLoaded', () => {
  const calcular = document.getElementById("calcular");
  const inputAporte = document.getElementById("aporte");
  const inputTaxa = document.getElementById("taxa");
  const inputAnos = document.getElementById("anos");
  const resultado = document.getElementById("resultado");
  const avisoIr = document.getElementById("avisoIr");

  function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR" , {
    style: "currency",
    currency: "BRL"
    });
  };

  function aliquotaIR(meses) {
    if (meses <= 6) return 0.225;
    else if (meses <= 12) return 0.20;
    else if (meses <= 24) return 0.175;
    else return 0.15;
  }

  calcular.addEventListener('click', () => {

    const aporte = Number(inputAporte.value);
    const taxaMensal = Number(inputTaxa.value) / 100;
    const anosTotais = Number(inputAnos.value);

    resultado.innerHTML = "";

    if (isNaN(aporte) || isNaN(taxaMensal) || isNaN(anosTotais) || aporte <= 0 || taxaMensal <= 0 || anosTotais <= 0) {
      resultado.innerHTML = "<strong>Preencha os valores corretamente.</strong>";
      avisoIr.style.display = "none";
      return;
    }

    avisoIr.style.display="block"
    avisoIr.innerHTML =`
      ⚠️ Os valores simulados incluem IR de acordo com o prazo:<br>
      - Até 180 dias: 22,5%<br>
      - 181 a 360 dias: 20%<br>
      - 361 a 720 dias: 17,5%<br>
      - Acima de 720 dias: 15%<br>
    `;

     for (let anos = 1; anos <= anosTotais; anos++) {
      const meses = anos * 12;
      let saldo = 0;

      for (let i = 0; i < meses; i++) {
        saldo += aporte;
        saldo *= (1 + taxaMensal);
      }

      const totalInvestido = aporte * meses;
      const lucroBruto = saldo - totalInvestido;
      const aliquota = aliquotaIR(meses);
      const valorIR = lucroBruto * aliquota;
      const lucroLiquido = lucroBruto - valorIR;
      const saldoLiquido = saldo - valorIR;

      resultado.innerHTML += `
        <div class="resultado">
         <strong>${anos} ano(s)</strong><br>
          Total investido: ${formatarMoeda(totalInvestido)}<br>
          Lucro bruto: ${formatarMoeda(lucroBruto)}<br>
          <span class="ir-valor">IR a pagar: ${formatarMoeda(valorIR)}</span><br>
          <span class="lucro-valor">Lucro líquido: <strong>${formatarMoeda(lucroLiquido)}</strong></span><br>
          Valor final líquido: ${formatarMoeda(saldoLiquido)}
        </div>
      `;
    };
  });
});