const { ContaReceber, CentroCusto, Empresa, Plano } = require("../models");

/**
 * Gera as parcelas do plano anual para uma empresa
 * @param {object} params
 * @param {object} params.empresa - Instância da empresa
 * @param {object} params.plano - Instância do plano
 * @param {object} params.transaction - Transaction Sequelize
 */
async function gerarParcelasPlanoAnual({ empresa, plano, transaction }) {
  const hoje = new Date();
  const diaContrato = hoje.getDate();
  const mesContrato = hoje.getMonth();
  const anoContrato = hoje.getFullYear();

  // 1ª parcela proporcional
  const dataPrimeiroVencimento = new Date(anoContrato, mesContrato + 1, diaContrato);
  const diffTime = Math.abs(dataPrimeiroVencimento - hoje);
  const diasProporcionais = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const valorDiario = parseFloat(plano.valorTotal / 365);
  const valorProporcional = +(valorDiario * diasProporcionais).toFixed(2);

  const hojeTimestamp = new Date();

  // 🔹 Cria ou busca CentroCusto padrão no schema public
  const [centroCustoPadrao] = await CentroCusto.schema("public").findOrCreate({
    where: { descricao: "Planos e Assinaturas" },
    defaults: {
      descricao: "Planos e Assinaturas",
      createdAt: hojeTimestamp,
      updatedAt: hojeTimestamp,
    },
    transaction,
  });

  // 1ª parcela proporcional
  await ContaReceber.schema("public").create(
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
      createdAt: hojeTimestamp,
      updatedAt: hojeTimestamp,
    },
    { transaction }
  );

  // 11 parcelas mensais subsequentes
  for (let i = 0; i < 11; i++) {
    const vencimento = new Date(anoContrato, mesContrato + 1 + i, diaContrato);

    // Corrige data inválida (ex: 30/02)
    if (vencimento.getDate() !== diaContrato) {
      vencimento.setDate(0); // Último dia do mês anterior
    }

    await ContaReceber.schema("public").create(
      {
        descricao: `Parcela ${i + 1} do plano ${plano.nome} para a empresa ${empresa.nome}`,
        valor: plano.valorMensal,
        desconto: 0,
        tipoDesconto: "valor",
        valorTotal: plano.valorMensal,
        vencimento,
        centroCustoId: centroCustoPadrao.id,
        status: "aberto",
        empresaId: empresa.id,
        createdAt: hojeTimestamp,
        updatedAt: hojeTimestamp,
      },
      { transaction }
    );
  }
}

/**
 * Verifica se a empresa pode ser ativada com base nos pagamentos
 * @param {number} empresaId
 */
async function verificarEAtivarEmpresa(empresaId) {
  try {
    const empresa = await Empresa.schema("public").findByPk(empresaId, {
      include: [{ model: Plano.schema("public") }],
    });
    if (!empresa || !empresa.Plano) return;

    const plano = empresa.Plano;

    // Verifica se existe pelo menos uma conta paga
    const algumaBaixada = await ContaReceber.schema("public").findOne({
      where: { empresaId, status: "pago" },
    });

    if (!algumaBaixada) {
      console.log("⚠️ Nenhuma conta baixada, empresa não será ativada.");
      return;
    }

    const hoje = new Date();
    const contasEmAberto = await ContaReceber.schema("public").findAll({
      where: { empresaId, status: "aberto" },
    });

    // Verifica se há conta vencida além do prazo
    const temContaVencida = contasEmAberto.some((conta) => {
      const vencimento = new Date(conta.vencimento);
      const diffDias = Math.ceil((hoje - vencimento) / (1000 * 60 * 60 * 24));
      return diffDias > plano.diasBloqueio;
    });

    if (!temContaVencida) {
      await empresa.update({ status: "ativo" });
      console.log("✅ Empresa ativada com sucesso.");
    } else {
      console.log(
        "⚠️ Empresa com conta vencida além do prazo, não será ativada."
      );
    }
  } catch (error) {
    console.error(
      "Erro ao verificar e ativar empresa:",
      error.message,
      error.stack
    );
  }
}

module.exports = {
  gerarParcelasPlanoAnual,
  verificarEAtivarEmpresa,
};
