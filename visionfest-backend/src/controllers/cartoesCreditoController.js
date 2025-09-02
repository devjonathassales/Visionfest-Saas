const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Usa o DB já injetado pelo middleware multi-tenant; senão resolve pelo tenant
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// Escopo por empresaId apenas se a coluna existir
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

// Normaliza número: ""/null/undefined/NaN -> null; senão Number
const num = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v))
    ? null
    : Number(v);

// Mantém somente campos existentes na model
function pickAllowed(Model, src, keys) {
  const out = {};
  for (const k of keys) {
    if (
      Object.prototype.hasOwnProperty.call(Model?.rawAttributes || {}, k) &&
      src[k] !== undefined
    ) {
      out[k] = src[k];
    }
  }
  return out;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CartaoCredito = db.CartaoCredito;
      if (!CartaoCredito) {
        console.error(
          "[cartoesCredito:listar] Model CartaoCredito não encontrado no tenant."
        );
        return res
          .status(500)
          .json({ error: "Modelo CartaoCredito não carregado no tenant." });
      }

      const { busca } = req.query || {};
      const where = scopedWhere(CartaoCredito, req);

      if (busca && String(busca).trim()) {
        const like = { [Op.iLike]: `%${String(busca).trim()}%` };
        const pesquisaveis = ["banco", "apelido", "adquirente", "bandeira"];
        const orConds = pesquisaveis
          .filter((k) => CartaoCredito.rawAttributes?.[k])
          .map((k) => ({ [k]: like }));
        if (orConds.length) where[Op.or] = orConds;
      }

      const order = [];
      if (CartaoCredito.rawAttributes?.banco) order.push(["banco", "ASC"]);
      if (CartaoCredito.rawAttributes?.createdAt) {
        order.push(["createdAt", "ASC"]);
      } else if (CartaoCredito.rawAttributes?.id) {
        order.push(["id", "ASC"]); // fallback seguro
      }

      const cartoes = await CartaoCredito.findAll({ where, order });
      return res.json(cartoes);
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
      return res.status(500).json({ error: "Erro ao buscar cartões" });
    }
  },

  async obterPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CartaoCredito = db.CartaoCredito;
      if (!CartaoCredito) {
        return res
          .status(500)
          .json({ error: "Modelo CartaoCredito não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(CartaoCredito, req, { id: Number(id) });
      const cartao = await CartaoCredito.findOne({ where });

      if (!cartao)
        return res.status(404).json({ error: "Cartão não encontrado" });
      return res.json(cartao);
    } catch (error) {
      console.error("Erro ao obter cartão:", error);
      return res.status(500).json({ error: "Erro ao obter cartão" });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CartaoCredito = db.CartaoCredito;
      if (!CartaoCredito) {
        return res
          .status(500)
          .json({ error: "Modelo CartaoCredito não carregado no tenant." });
      }

      const { banco } = req.body || {};
      if (!banco || !String(banco).trim()) {
        return res.status(400).json({ error: "Banco é obrigatório" });
      }

      const campos = [
        "banco",
        "apelido",
        "adquirente",
        "bandeira",
        "taxaVista",
        "taxaParcelado",
        "taxaDebito",
        "ativo",
      ];
      const payload = pickAllowed(CartaoCredito, req.body || {}, campos);

      // normalizações
      if ("taxaVista" in payload) payload.taxaVista = num(payload.taxaVista);
      if ("taxaParcelado" in payload)
        payload.taxaParcelado = num(payload.taxaParcelado);
      if ("taxaDebito" in payload) payload.taxaDebito = num(payload.taxaDebito);
      if ("ativo" in payload) payload.ativo = !!payload.ativo;

      // empresaId, se houver coluna
      if (CartaoCredito?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      // Banco sempre trimado
      payload.banco = String(banco).trim();

      const novo = await CartaoCredito.create(payload);
      return res.status(201).json(novo);
    } catch (error) {
      console.error("Erro ao criar cartão:", error);
      return res.status(500).json({ error: "Erro ao criar cartão" });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CartaoCredito = db.CartaoCredito;
      if (!CartaoCredito) {
        return res
          .status(500)
          .json({ error: "Modelo CartaoCredito não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(CartaoCredito, req, { id: Number(id) });
      const cartao = await CartaoCredito.findOne({ where });
      if (!cartao)
        return res.status(404).json({ error: "Cartão não encontrado" });

      const campos = [
        "banco",
        "apelido",
        "adquirente",
        "bandeira",
        "taxaVista",
        "taxaParcelado",
        "taxaDebito",
        "ativo",
      ];
      const updates = pickAllowed(CartaoCredito, req.body || {}, campos);

      if (updates.banco !== undefined) {
        if (!String(updates.banco).trim()) {
          return res.status(400).json({ error: "Banco é obrigatório" });
        }
        updates.banco = String(updates.banco).trim();
      }

      if ("taxaVista" in updates) updates.taxaVista = num(updates.taxaVista);
      if ("taxaParcelado" in updates)
        updates.taxaParcelado = num(updates.taxaParcelado);
      if ("taxaDebito" in updates) updates.taxaDebito = num(updates.taxaDebito);
      if ("ativo" in updates) updates.ativo = !!updates.ativo;

      // remove undefined
      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await cartao.update(updates);
      return res.json(cartao);
    } catch (error) {
      console.error("Erro ao atualizar cartão:", error);
      return res.status(500).json({ error: "Erro ao atualizar cartão" });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CartaoCredito = db.CartaoCredito;
      if (!CartaoCredito) {
        return res
          .status(500)
          .json({ error: "Modelo CartaoCredito não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(CartaoCredito, req, { id: Number(id) });
      const cartao = await CartaoCredito.findOne({ where });
      if (!cartao)
        return res.status(404).json({ error: "Cartão não encontrado" });

      await cartao.destroy();
      return res.json({ mensagem: "Cartão excluído com sucesso" });
    } catch (error) {
      if (error?.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({
          error: "Cartão vinculado a transações; não pode ser excluído.",
        });
      }
      console.error("Erro ao excluir cartão:", error);
      return res.status(500).json({ error: "Erro ao excluir cartão" });
    }
  },
};
