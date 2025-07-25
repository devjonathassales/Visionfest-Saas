const { ContaReceber, CentroCusto } = require("../models");

async function gerarParcelasPlanoAnual({ empresa, plano, diaVencimento, transaction }) {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();
  const anoHoje = hoje.getFullYear();

  // Próxima data de vencimento escolhida pelo cliente
  let dataPrimeiroVencimento = new Date(anoHoje, mesHoje, diaVencimento);
  if (diaHoje >= diaVencimento) {
    // Já passou, vai para o próximo mês
    dataPrimeiroVencimento.setMonth(dataPrimeiroVencimento.getMonth() + 1);
  }

  // Dias proporcionais entre hoje e o primeiro vencimento
  const diffTime = Math.abs(dataPrimeiroVencimento - hoje);
  const diasProporcionais = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const valorDiario = parseFloat(plano.valorTotal / 365); // valor diário
  const valorProporcional = +(valorDiario * diasProporcionais).toFixed(2);

  // 🔥 Centro de custo padrão (cria se não existir)
  const [centroCustoPadrao] = await CentroCusto.findOrCreate({
    where: { descricao: "Planos e Assinaturas" },
    defaults: { descricao: "Planos e Assinaturas" },
    transaction
  });

  console.log("✅ Centro de custo encontrado:", centroCustoPadrao.descricao);

  // 🔥 Criar entrada proporcional
  console.log(`📄 Criando entrada proporcional: R$ ${valorProporcional}`);
  await ContaReceber.create(
    {
      descricao: `Entrada proporcional do plano ${plano.nome} para a empresa ${empresa.nome}`,
      valor: valorProporcional,
      desconto: 0,
      tipoDesconto: "valor",
      valorTotal: valorProporcional,
      vencimento: hoje,
      centroCustoId: centroCustoPadrao.id,
      status: "aberto",
      empresaId: empresa.id,
    },
    { transaction }
  );

  // 🔥 Criar 11 contas a receber mensais
  for (let i = 0; i < 11; i++) {
    const vencimento = new Date(dataPrimeiroVencimento);
    vencimento.setMonth(dataPrimeiroVencimento.getMonth() + i);

    console.log(
      `📅 Criando parcela ${i + 1}: Vencimento ${vencimento.toLocaleDateString()} - R$ ${plano.valorMensal}`
    );

    await ContaReceber.create(
      {
        descricao: `Parcela ${i + 1} do plano ${plano.nome} para a empresa ${empresa.nome}`,
        valor: plano.valorMensal,
        desconto: 0,
        tipoDesconto: "valor",
        valorTotal: plano.valorMensal,
        vencimento: vencimento,
        centroCustoId: centroCustoPadrao.id,
        status: "aberto",
        empresaId: empresa.id,
      },
      { transaction }
    );
  }
}

module.exports = { gerarParcelasPlanoAnual };
