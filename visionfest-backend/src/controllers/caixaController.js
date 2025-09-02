// src/controllers/caixaController.js
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Usa o db já injetado pelo authCliente quando houver; senão resolve pelo host/header/query
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// Aplica empresaId no where apenas se a coluna existir no Model
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

// Injeta empresaId no payload somente se a coluna existir
function withEmpresaId(Model, req, payload = {}) {
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    return { ...payload, empresaId: req.empresaId };
  }
  return payload;
}

module.exports = {
  async abrirCaixa(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Caixa = db.Caixa;

      // fecha qualquer caixa aberto deste tenant/empresa (quando coluna existir)
      await Caixa.update(
        { aberto: false, dataFechamento: new Date() },
        { where: scopedWhere(Caixa, req, { aberto: true }) }
      );

      const payload = withEmpresaId(Caixa, req, {
        aberto: true,
        dataAbertura: new Date(),
        dataFechamento: null,
      });

      const caixa = await Caixa.create(payload);
      return res.status(201).json(caixa);
    } catch (error) {
      console.error("[caixaController] abrirCaixa:", error);
      return res.status(500).json({ message: "Erro ao abrir caixa." });
    }
  },

  async fecharCaixa(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Caixa = db.Caixa;

      const caixaAberto = await Caixa.findOne({
        where: scopedWhere(Caixa, req, { aberto: true }),
      });

      if (!caixaAberto) {
        return res
          .status(400)
          .json({ message: "Nenhum caixa aberto encontrado." });
      }

      await caixaAberto.update({
        aberto: false,
        dataFechamento: new Date(),
      });

      return res.json(caixaAberto);
    } catch (error) {
      console.error("[caixaController] fecharCaixa:", error);
      return res.status(500).json({ message: "Erro ao fechar caixa." });
    }
  },

  async getCaixaAtual(req, res) {
    try {
      const db = await getDbFromReq(req);
      const Caixa = db.Caixa;

      const caixaAberto = await Caixa.findOne({
        where: scopedWhere(Caixa, req, { aberto: true }),
      });

      if (!caixaAberto) {
        // Sem caixa aberto: retorna objeto padrão
        return res.json({
          aberto: false,
          dataAbertura: null,
          dataFechamento: null,
        });
      }

      return res.json(caixaAberto);
    } catch (error) {
      console.error("[caixaController] getCaixaAtual:", error);
      return res.status(500).json({ message: "Erro ao obter caixa atual." });
    }
  },

  async addEntradaManual(req, res) {
    try {
      const db = await getDbFromReq(req);
      const EntradaManual = db.EntradaManual;

      let { descricao, valor, formaPagamento } = req.body || {};
      if (!descricao || valor === undefined || !formaPagamento) {
        return res
          .status(400)
          .json({ message: "Campos obrigatórios não preenchidos." });
      }

      valor = Number(valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        return res.status(400).json({ message: "Valor inválido." });
      }

      const entrada = await EntradaManual.create(
        withEmpresaId(EntradaManual, req, {
          descricao: String(descricao).trim(),
          valor,
          formaPagamento: String(formaPagamento).trim().toLowerCase(),
          data: new Date(),
        })
      );

      return res.status(201).json(entrada);
    } catch (error) {
      console.error("[caixaController] addEntradaManual:", error);
      return res
        .status(500)
        .json({ message: "Erro ao adicionar entrada manual." });
    }
  },

  async addSaidaManual(req, res) {
    try {
      const db = await getDbFromReq(req);
      const SaidaManual = db.SaidaManual;

      let { descricao, valor, formaPagamento } = req.body || {};
      if (!descricao || valor === undefined || !formaPagamento) {
        return res
          .status(400)
          .json({ message: "Campos obrigatórios não preenchidos." });
      }

      valor = Number(valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        return res.status(400).json({ message: "Valor inválido." });
      }

      const saida = await SaidaManual.create(
        withEmpresaId(SaidaManual, req, {
          descricao: String(descricao).trim(),
          valor,
          formaPagamento: String(formaPagamento).trim().toLowerCase(),
          data: new Date(),
        })
      );

      return res.status(201).json(saida);
    } catch (error) {
      console.error("[caixaController] addSaidaManual:", error);
      return res
        .status(500)
        .json({ message: "Erro ao adicionar saída manual." });
    }
  },

  async listarEntradas(req, res) {
    try {
      const db = await getDbFromReq(req);
      const EntradaManual = db.EntradaManual;

      const entradas = await EntradaManual.findAll({
        where: scopedWhere(EntradaManual, req),
        order: [["data", "DESC"]],
      });

      return res.json(entradas);
    } catch (error) {
      console.error("[caixaController] listarEntradas:", error);
      return res
        .status(500)
        .json({ message: "Erro ao listar entradas manuais." });
    }
  },

  async listarSaidas(req, res) {
    try {
      const db = await getDbFromReq(req);
      const SaidaManual = db.SaidaManual;

      const saidas = await SaidaManual.findAll({
        where: scopedWhere(SaidaManual, req),
        order: [["data", "DESC"]],
      });

      return res.json(saidas);
    } catch (error) {
      console.error("[caixaController] listarSaidas:", error);
      return res
        .status(500)
        .json({ message: "Erro ao listar saídas manuais." });
    }
  },
};
