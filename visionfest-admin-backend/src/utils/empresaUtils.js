// utils/empresaUtils.js
const { Empresa, Plano, ContaReceber } = require("../models");

async function verificarEAtivarEmpresa(empresaId) {
  const empresa = await Empresa.findByPk(empresaId, {
    include: [
      { model: ContaReceber, as: "contasReceber" },
      { model: Plano },
    ],
  });

  if (!empresa || !empresa.Plano || !empresa.contasReceber) return;

  const hoje = new Date();

  const possuiContaPaga = empresa.contasReceber.some(
    (c) => c.status === "pago"
  );

  const algumaEmAtraso = empresa.contasReceber.some((conta) => {
    if (conta.status === "pago") return false;

    const vencimento = new Date(conta.vencimento);
    const diasAtraso = Math.floor((hoje - vencimento) / (1000 * 60 * 60 * 24));

    return vencimento < hoje && diasAtraso > empresa.Plano.diasBloqueio;
  });

  if (possuiContaPaga && !algumaEmAtraso && empresa.status !== "ativo") {
    empresa.status = "ativo";
    await empresa.save();
    console.log(`✅ Empresa "${empresa.nome}" ativada automaticamente.`);
  }
}

module.exports = {
  verificarEAtivarEmpresa,
};
