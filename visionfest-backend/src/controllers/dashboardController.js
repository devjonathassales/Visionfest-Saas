const { Op, fn, col, literal } = require("sequelize");
const { getDbCliente } = require("../utils/tenant");

// helpers
const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];
const pickAttr = (Model, candidates = []) =>
  candidates.find((n) => !!Model?.rawAttributes?.[n]);

// aplica where base + empresaId se a coluna existir
function scopedWhere(Model, empresaId, base = {}) {
  const where = { ...base };
  if (empresaId && hasAttr(Model, "empresaId")) where.empresaId = empresaId;
  return where;
}

async function dashboardResumo(req, res) {
  try {
    // ✅ use o req; o helper resolve o domínio, abre o DB e seta req.tenantDb/req.empresaId
    const db = await getDbCliente(req);

    // Acesso seguro aos models (db.models.X || db.X)
    const Cliente = (db.models && db.models.Cliente) || db.Cliente;
    const ContaReceber =
      (db.models && db.models.ContaReceber) || db.ContaReceber;
    const Contrato = (db.models && db.models.Contrato) || db.Contrato;
    const EstoqueMovimentacao =
      (db.models && db.models.EstoqueMovimentacao) || db.EstoqueMovimentacao;

    const sequelize = db.sequelize;
    const empresaId = req.empresaId;

    if (!empresaId) {
      return res.status(400).json({ error: "empresaId ausente." });
    }

    // ===== 1) Total de clientes =====
    let totalClientes = 0;
    if (Cliente && typeof Cliente.count === "function") {
      try {
        totalClientes = await Cliente.count({
          where: scopedWhere(Cliente, empresaId),
        });
      } catch {
        totalClientes = 0;
      }
    }

    // ===== 2) Saldo total em estoque (entradas - saídas) =====
    let totalProdutos = 0;
    if (
      EstoqueMovimentacao &&
      typeof EstoqueMovimentacao.findOne === "function"
    ) {
      try {
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
          where: scopedWhere(EstoqueMovimentacao, empresaId),
          raw: true,
        });
        totalProdutos = Number(estoqueResult?.estoqueTotal || 0);
      } catch {
        totalProdutos = 0;
      }
    }

    // Janela mês atual
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    ultimoDiaMes.setHours(23, 59, 59, 999);

    // ===== 3) Faturamento do mês =====
    // coluna de valor pode ser "valorTotal" ou "valor"
    let valorCol = "valorTotal";
    if (
      ContaReceber &&
      !hasAttr(ContaReceber, "valorTotal") &&
      hasAttr(ContaReceber, "valor")
    ) {
      valorCol = "valor";
    }

    let totalFaturamento = 0;
    if (ContaReceber && typeof ContaReceber.sum === "function") {
      try {
        totalFaturamento =
          (await ContaReceber.sum(valorCol, {
            where: scopedWhere(ContaReceber, empresaId, {
              vencimento: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
              // tolera maiúsculas/minúsculas
              status: { [Op.in]: ["aberto", "Aberto", "pago", "Pago"] },
            }),
          })) || 0;
      } catch {
        totalFaturamento = 0;
      }
    }

    // ===== 4) Contratos do mês =====
    let totalContratosMes = 0;
    if (Contrato && typeof Contrato.count === "function") {
      // tenta dataEvento; se não existir, tenta createdAt
      const dataCol = hasAttr(Contrato, "dataEvento")
        ? "dataEvento"
        : hasAttr(Contrato, "createdAt")
        ? "createdAt"
        : null;

      if (dataCol) {
        try {
          totalContratosMes = await Contrato.count({
            where: scopedWhere(Contrato, empresaId, {
              [dataCol]: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
            }),
          });
        } catch {
          totalContratosMes = 0;
        }
      }
    }

    // ===== 5) Faturamento últimos 6 meses (série para gráfico) =====
    let faturamentoPorMesRaw = [];
    if (ContaReceber && typeof ContaReceber.findAll === "function") {
      try {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
        faturamentoPorMesRaw = await ContaReceber.findAll({
          attributes: [
            [fn("date_trunc", "month", col("vencimento")), "mes"],
            [fn("sum", col(valorCol)), "total"],
          ],
          where: scopedWhere(ContaReceber, empresaId, {
            vencimento: { [Op.gte]: inicio },
            status: { [Op.in]: ["aberto", "Aberto", "pago", "Pago"] },
          }),
          group: [literal("mes")],
          order: [[literal("mes"), "ASC"]],
          raw: true,
        });
      } catch {
        faturamentoPorMesRaw = [];
      }
    }

    // Normaliza para sempre ter 6 pontos
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
      totalClientes: Number(totalClientes),
      totalProdutos: Number(totalProdutos),
      totalFaturamento: Number(totalFaturamento),
      totalContratosMes: Number(totalContratosMes),
      faturamentoUltimos6Meses: meses,
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({ error: "Erro ao carregar dados do dashboard." });
  }
}

module.exports = { dashboardResumo };
