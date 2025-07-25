const { Cliente, Produto, ContaReceber, Contrato, EstoqueMovimentacao, sequelize } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

async function dashboardResumo(req, res) {
  try {
    const totalClientes = await Cliente.count();

    const estoqueResult = await EstoqueMovimentacao.findOne({
      attributes: [
        [sequelize.literal(`
          SUM(CASE
            WHEN tipo = 'entrada' THEN quantidade
            WHEN tipo = 'saida' THEN -quantidade
            ELSE 0
          END)`), "estoqueTotal"]
      ],
      raw: true,
    });
    const totalProdutos = parseFloat(estoqueResult?.estoqueTotal) || 0;

    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const totalFaturamento = await ContaReceber.sum("valor", {
      where: {
        vencimento: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
        status: { [Op.in]: ["aberto", "pago"] },
      },
    }) || 0;

    const totalContratosMes = await Contrato.count({
      where: {
        createdAt: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
      },
    });

    const dataInicioGrafico = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    const faturamentoPorMesRaw = await ContaReceber.findAll({
      attributes: [
        [fn("date_trunc", "month", col("vencimento")), "mes"],
        [fn("sum", col("valor")), "total"],
      ],
      where: {
        vencimento: { [Op.gte]: dataInicioGrafico },
        status: { [Op.in]: ["aberto", "pago"] },
      },
      group: [literal("mes")],
      order: [[literal("mes"), "ASC"]],
      raw: true,
    });

    const meses = [];
    for (let i = 0; i < 6; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const mesFormatado = data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const encontrado = faturamentoPorMesRaw.find(f => {
        const d = new Date(f.mes);
        return d.getFullYear() === data.getFullYear() && d.getMonth() === data.getMonth();
      });
      meses.push({
        mes: mesFormatado,
        total: encontrado ? parseFloat(encontrado.total) : 0,
      });
    }

    res.json({
      totalClientes,
      totalProdutos,
      totalFaturamento,
      totalContratosMes,
      faturamentoUltimos6Meses: meses,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ error: "Erro ao carregar dados do dashboard." });
  }
}

module.exports = { dashboardResumo };
