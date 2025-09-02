const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// tenta usar o db já colocado pelo middleware; se não, resolve na hora
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// aplica escopo por empresaId somente se o campo existir no model
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

module.exports = {
  async listarEstoque(req, res) {
    try {
      const { inicio, fim } = req.query;
      if (!inicio || !fim) {
        return res
          .status(400)
          .json({ erro: "Informe o período inicial e final (inicio/fim)." });
      }

      const db = await getDbFromReq(req);
      const { Produto, EstoqueMovimentacao, ContratoProduto, sequelize } = db;

      // 1) Produtos da empresa
      const produtos = await Produto.findAll({
        where: scopedWhere(Produto, req),
        order: [["nome", "ASC"]],
      });

      // 2) Movimentações (entradas/saídas) no período
      const movWhere = scopedWhere(EstoqueMovimentacao, req, {
        data: { [Op.between]: [inicio, fim] },
      });

      const movimentacoes = await EstoqueMovimentacao.findAll({
        where: movWhere,
        attributes: [
          "produtoId",
          "tipo",
          [sequelize.fn("SUM", sequelize.col("quantidade")), "total"],
        ],
        group: ["produtoId", "tipo"],
        raw: true,
      });

      // 3) Provisionamentos (itens em contratos) no período
      const provWhere = scopedWhere(ContratoProduto, req, {
        dataEvento: { [Op.between]: [inicio, fim] },
      });

      const provisionamentos = await ContratoProduto.findAll({
        where: provWhere,
        attributes: [
          "produtoId",
          [sequelize.fn("SUM", sequelize.col("quantidade")), "total"],
        ],
        group: ["produtoId"],
        raw: true,
      });

      // 4) Mapas auxiliares
      const entradaMap = {};
      const saidaMap = {};
      const provisionadoMap = {};

      movimentacoes.forEach((m) => {
        const total = parseInt(m.total, 10) || 0;
        if (m.tipo === "entrada") entradaMap[m.produtoId] = total;
        if (m.tipo === "saida") saidaMap[m.produtoId] = total;
      });

      provisionamentos.forEach((p) => {
        provisionadoMap[p.produtoId] = parseInt(p.total, 10) || 0;
      });

      // 5) Monta resposta
      const estoque = produtos.map((produto) => {
        const entradas = entradaMap[produto.id] || 0;
        const saídas = saidaMap[produto.id] || 0;
        const provisionado = provisionadoMap[produto.id] || 0;
        const estoqueAtual = entradas - saídas;
        const estoqueDisponivel = estoqueAtual - provisionado;

        return {
          id: produto.id,
          nome: produto.nome,
          estoque: estoqueAtual,
          estoqueMinimo: produto.estoqueMinimo,
          provisionado,
          estoqueDisponivel,
        };
      });

      return res.json(estoque);
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      return res.status(500).json({ erro: "Erro ao buscar estoque." });
    }
  },

  async registrarMovimentacao(req, res) {
    try {
      const { produtoId, tipo, quantidade } = req.body;

      if (!produtoId || !tipo || quantidade == null) {
        return res
          .status(400)
          .json({ erro: "Envie produtoId, tipo e quantidade." });
      }
      const tipoNorm = String(tipo).toLowerCase();
      if (!["entrada", "saida"].includes(tipoNorm)) {
        return res.status(400).json({ erro: "Tipo inválido (entrada/saida)." });
      }
      const qtdNum = Number(quantidade);
      if (!Number.isFinite(qtdNum) || qtdNum <= 0) {
        return res
          .status(400)
          .json({ erro: "Quantidade deve ser um número > 0." });
      }

      const db = await getDbFromReq(req);
      const { Produto, EstoqueMovimentacao } = db;

      const prod = await Produto.findOne({
        where: scopedWhere(Produto, req, { id: Number(produtoId) }),
      });
      if (!prod) {
        return res
          .status(404)
          .json({ erro: "Produto não encontrado para esta empresa." });
      }

      const payload = {
        produtoId: prod.id,
        tipo: tipoNorm,
        quantidade: qtdNum,
        data: new Date(),
      };

      // injeta empresaId se existir no model
      if (EstoqueMovimentacao?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const nova = await EstoqueMovimentacao.create(payload);
      return res.status(201).json(nova);
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      return res.status(500).json({ erro: "Erro ao registrar movimentação." });
    }
  },
};
