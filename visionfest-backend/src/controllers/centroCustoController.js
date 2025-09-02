// src/controllers/centroCustoController.js
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Usa o db já colocado pelo middleware; se não, resolve na hora
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// Aplica empresaId somente se a coluna existir no model
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

// Normaliza 'tipo' aceitando variações de caixa
function normalizeTipo(v) {
  const t = String(v || "")
    .trim()
    .toLowerCase();
  if (t === "custo") return "Custo";
  if (t === "receita") return "Receita";
  if (t === "ambos") return "Ambos";
  return null;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CentroCusto = db.CentroCusto;
      if (!CentroCusto) {
        console.error(
          "[centroCusto:listar] Model CentroCusto ausente no tenant."
        );
        return res
          .status(500)
          .json({
            error: "Model CentroCusto não carregado no schema do tenant.",
          });
      }

      const where = scopedWhere(CentroCusto, req);
      const order = [];
      if (CentroCusto.rawAttributes?.descricao)
        order.push(["descricao", "ASC"]);
      else if (CentroCusto.rawAttributes?.id) order.push(["id", "ASC"]);

      const centros = await CentroCusto.findAll({ where, order });
      return res.json(centros);
    } catch (error) {
      console.error("Erro ao listar centros de custo:", error);
      return res
        .status(500)
        .json({ error: "Erro ao listar centros de custo." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CentroCusto = db.CentroCusto;
      if (!CentroCusto) {
        console.error(
          "[centroCusto:criar] Model CentroCusto ausente no tenant."
        );
        return res
          .status(500)
          .json({
            error: "Model CentroCusto não carregado no schema do tenant.",
          });
      }

      let { descricao, tipo } = req.body || {};
      descricao = String(descricao || "").trim();
      const tipoNorm = normalizeTipo(tipo);

      if (!descricao || !tipoNorm) {
        return res
          .status(400)
          .json({
            error: "Descrição e tipo (Custo/Receita/Ambos) são obrigatórios.",
          });
      }

      const payload = { descricao, tipo: tipoNorm };
      if (CentroCusto?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const novo = await CentroCusto.create(payload);
      return res.status(201).json(novo);
    } catch (error) {
      console.error("Erro ao criar centro de custo:", error);
      return res.status(500).json({ error: "Erro ao criar centro de custo." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CentroCusto = db.CentroCusto;
      if (!CentroCusto) {
        console.error(
          "[centroCusto:atualizar] Model CentroCusto ausente no tenant."
        );
        return res
          .status(500)
          .json({
            error: "Model CentroCusto não carregado no schema do tenant.",
          });
      }

      const { id } = req.params;
      const where = scopedWhere(CentroCusto, req, { id: Number(id) });
      const centro = await CentroCusto.findOne({ where });
      if (!centro) {
        return res
          .status(404)
          .json({ error: "Centro de custo não encontrado." });
      }

      let { descricao, tipo } = req.body || {};
      const updates = {};

      if (descricao !== undefined) {
        updates.descricao = String(descricao || "").trim();
      }
      if (tipo !== undefined) {
        const tipoNorm = normalizeTipo(tipo);
        if (!tipoNorm) {
          return res
            .status(400)
            .json({ error: "Tipo inválido. Use Custo, Receita ou Ambos." });
        }
        updates.tipo = tipoNorm;
      }

      await centro.update(updates);
      return res.json(centro);
    } catch (error) {
      console.error("Erro ao atualizar centro de custo:", error);
      return res
        .status(500)
        .json({ error: "Erro ao atualizar centro de custo." });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const CentroCusto = db.CentroCusto;
      if (!CentroCusto) {
        console.error(
          "[centroCusto:excluir] Model CentroCusto ausente no tenant."
        );
        return res
          .status(500)
          .json({
            error: "Model CentroCusto não carregado no schema do tenant.",
          });
      }

      const { id } = req.params;
      const where = scopedWhere(CentroCusto, req, { id: Number(id) });
      const centro = await CentroCusto.findOne({ where });
      if (!centro) {
        return res
          .status(404)
          .json({ error: "Centro de custo não encontrado." });
      }

      await centro.destroy();
      return res.json({ mensagem: "Centro de custo excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir centro de custo:", error);
      return res
        .status(500)
        .json({ error: "Erro ao excluir centro de custo." });
    }
  },
};
