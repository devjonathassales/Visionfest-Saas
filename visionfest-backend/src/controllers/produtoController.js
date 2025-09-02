// src/controllers/produtoController.js
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

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Produto = db.Produto;

      const { busca, tipo } = req.query;
      const where = scopedWhere(Produto, req);

      if (busca && String(busca).trim() !== "") {
        where[Op.or] = [{ nome: { [Op.iLike]: `%${busca}%` } }];
      }
      if (tipo && ["venda", "locacao"].includes(tipo)) {
        where.tipoProduto = tipo;
      }

      const produtos = await Produto.findAll({
        where,
        order: [["nome", "ASC"]],
      });

      return res.json(produtos);
    } catch (error) {
      console.error("Erro listar produtos:", error);
      return res.status(500).json({ message: "Erro ao listar produtos." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Produto = db.Produto;

      const { id } = req.params;
      const where = scopedWhere(Produto, req, { id: Number(id) });

      const produto = await Produto.findOne({ where });
      if (!produto)
        return res.status(404).json({ message: "Produto não encontrado." });

      return res.json(produto);
    } catch (error) {
      console.error("Erro buscar produto:", error);
      return res.status(500).json({ message: "Erro ao buscar produto." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Produto = db.Produto;

      const {
        nome,
        valor, // número (pode vir string)
        movimentaEstoque, // boolean
        estoqueMinimo, // número
        tipoProduto, // 'venda' | 'locacao'
        descricao,
      } = req.body || {};

      if (!nome || !String(nome).trim()) {
        return res.status(400).json({ message: "Nome é obrigatório." });
      }

      const payload = {
        nome: String(nome).trim(),
        descricao: descricao ?? null,
        valor: toNumberOrNull(valor),
        movimentaEstoque: !!movimentaEstoque,
        estoqueMinimo: Number.isFinite(Number(estoqueMinimo))
          ? Number(estoqueMinimo)
          : 0,
        tipoProduto: ["venda", "locacao"].includes(tipoProduto)
          ? tipoProduto
          : "venda",
      };

      // injeta empresaId se existir a coluna
      if (Produto?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const novo = await Produto.create(payload);
      return res.status(201).json(novo);
    } catch (error) {
      console.error("Erro criar produto:", error);
      return res.status(500).json({ message: "Erro ao criar produto." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Produto = db.Produto;

      const { id } = req.params;
      const where = scopedWhere(Produto, req, { id: Number(id) });
      const produto = await Produto.findOne({ where });
      if (!produto)
        return res.status(404).json({ message: "Produto não encontrado." });

      const {
        nome,
        valor,
        movimentaEstoque,
        estoqueMinimo,
        tipoProduto,
        descricao,
      } = req.body || {};

      const updates = {
        ...(nome !== undefined && { nome: String(nome).trim() }),
        ...(descricao !== undefined && { descricao }),
        ...(valor !== undefined && { valor: toNumberOrNull(valor) }),
        ...(movimentaEstoque !== undefined && {
          movimentaEstoque: !!movimentaEstoque,
        }),
        ...(estoqueMinimo !== undefined && {
          estoqueMinimo: Number.isFinite(Number(estoqueMinimo))
            ? Number(estoqueMinimo)
            : 0,
        }),
        ...(tipoProduto !== undefined && {
          tipoProduto: ["venda", "locacao"].includes(tipoProduto)
            ? tipoProduto
            : "venda",
        }),
      };

      // remove undefined para não sobrescrever
      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await produto.update(updates);
      return res.json(produto);
    } catch (error) {
      console.error("Erro atualizar produto:", error);
      return res.status(500).json({ message: "Erro ao atualizar produto." });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Produto = db.Produto;

      const { id } = req.params;
      const where = scopedWhere(Produto, req, { id: Number(id) });
      const produto = await Produto.findOne({ where });
      if (!produto)
        return res.status(404).json({ message: "Produto não encontrado." });

      await produto.destroy();
      return res.json({ message: "Produto excluído com sucesso." });
    } catch (error) {
      console.error("Erro excluir produto:", error);
      return res.status(500).json({ message: "Erro ao excluir produto." });
    }
  },
};
