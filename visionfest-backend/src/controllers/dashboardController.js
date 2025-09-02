const { Op, fn, col, literal } = require("sequelize");
const { getDbCliente } = require("../utils/tenant");

async function dashboardResumo(req, res) {
  try {
    // ⚠️ precisa de await
    const db = await getDbCliente(req.bancoCliente);
    const { Cliente, ContaReceber, Contrato, EstoqueMovimentacao } = db.models;
    const sequelize = db.sequelize;

    const empresaId = req.empresaId;
    if (!empresaId)
      return res.status(400).json({ error: "empresaId ausente." });

    // Totais seguros
    const totalClientes = await Cliente.count({ where: { empresaId } }).catch(
      () => 0
    );

    // Saldo total em estoque (entradas - saídas)
    const estoqueResult = await EstoqueMovimentacao.findOne({
      attributes: [
        [
          sequelize.literal(`
            COALESCE(SUM(CASE
              WHEN tipo = 'entrada' THEN quantidade
              WHEN tipo = 'saida'   THEN -quantidade
              ELSE 0
            END), 0)
          `),
          "estoqueTotal",
        ],
      ],
      where: { empresaId },
      raw: true,
    }).catch(() => ({ estoqueTotal: 0 }));
    const totalProdutos = Number(estoqueResult?.estoqueTotal || 0);

    // Janela mês atual
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Faturamento do mês (status podem ser "Aberto"/"Pago")
    const totalFaturamento =
      (await ContaReceber.sum("valorTotal", {
        where: {
          empresaId,
          vencimento: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
          status: { [Op.in]: ["Aberto", "Pago"] },
        },
      }).catch(() => 0)) || 0;

    // Contratos do mês (pela data do evento)
    const totalContratosMes = await Contrato.count({
      where: {
        empresaId,
        dataEvento: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
      },
    }).catch(() => 0);

    // Faturamento últimos 6 meses
    const dataInicioGrafico = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 5,
      1
    );
    const faturamentoPorMesRaw = await ContaReceber.findAll({
      attributes: [
        [fn("date_trunc", "month", col("vencimento")), "mes"],
        [fn("sum", col("valorTotal")), "total"],
      ],
      where: {
        empresaId,
        vencimento: { [Op.gte]: dataInicioGrafico },
        status: { [Op.in]: ["Aberto", "Pago"] },
      },
      group: [literal("mes")],
      order: [[literal("mes"), "ASC"]],
      raw: true,
    }).catch(() => []);

    // Normaliza para 6 pontos
    const meses = [];
    for (let i = 0; i < 6; i++) {
      const base = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
      const label = base.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      const found = faturamentoPorMesRaw.find((f) => {
        const d = new Date(f.mes);
        return (
          d.getFullYear() === base.getFullYear() &&
          d.getMonth() === base.getMonth()
        );
      });
      meses.push({ mes: label, total: found ? Number(found.total) : 0 });
    }

    res.json({
      totalClientes,
      totalProdutos,
      totalFaturamento: Number(totalFaturamento),
      totalContratosMes,
      faturamentoUltimos6Meses: meses,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ error: "Erro ao carregar dados do dashboard." });
  }
}

module.exports = { dashboardResumo };
