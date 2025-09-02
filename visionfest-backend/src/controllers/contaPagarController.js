// src/controllers/contaPagarController.js
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Usa o db do middleware (req.tenantDb). Se não houver, resolve pelo tenant.
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// dd/mm/aaaa -> aaaa-mm-dd (ou mantém ISO se já vier assim)
function normalizeDate(d) {
  if (!d || typeof d !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d; // já ISO (YYYY-MM-DD)
  const [dd, mm, yyyy] = d.split("/");
  if (dd && mm && yyyy)
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  return d;
}

// Aplica empresaId só se o atributo existir no Model e se vier no req
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId) {
    where.empresaId = req.empresaId;
  }
  return where;
}

// Includes “defensivos”: só adiciona se os models existirem no tenant
function basicIncludes(db) {
  const inc = [];
  if (db.Fornecedor) {
    inc.push({
      model: db.Fornecedor,
      as: "fornecedor",
      attributes: ["id", "nome"],
    });
  }
  if (db.CentroCusto) {
    inc.push({
      model: db.CentroCusto,
      as: "centroCusto",
      attributes: ["id", "descricao", "tipo"],
    });
  }
  if (db.ContaBancaria) {
    inc.push({
      model: db.ContaBancaria,
      as: "contaBancaria",
      attributes: ["id", "banco", "agencia", "conta"],
    });
  }
  return inc;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        console.error(
          "[contasPagar:listar] Model ContaPagar não encontrado no tenant."
        );
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const { dataInicio, dataFim, fornecedorId } = req.query || {};
      const di = normalizeDate(dataInicio);
      const df = normalizeDate(dataFim);

      const where = scopedWhere(ContaPagar, req);
      if (di && df) where.vencimento = { [Op.between]: [di, df] };
      if (fornecedorId) where.fornecedorId = Number(fornecedorId);

      const contas = await ContaPagar.findAll({
        where,
        include: basicIncludes(db),
        order: [
          ["vencimento", "ASC"],
          ["createdAt", "ASC"],
        ],
      });

      return res.json(contas);
    } catch (error) {
      console.error("Erro ao listar contas a pagar:", error);
      return res
        .status(500)
        .json({ message: "Erro ao listar contas a pagar." });
    }
  },

  async obterPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaPagar, req, { id: Number(id) });

      const conta = await ContaPagar.findOne({
        where,
        include: basicIncludes(db),
      });

      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta a pagar não encontrada." });
      return res.json(conta);
    } catch (error) {
      console.error("Erro ao buscar conta a pagar:", error);
      return res.status(500).json({ message: "Erro ao buscar conta a pagar." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const {
        descricao,
        valor,
        desconto = 0,
        tipoDesconto = "valor", // "valor" | "percentual"
        valorTotal,
        vencimento,
        fornecedorId,
        centroCustoId,
      } = req.body || {};

      if (!fornecedorId) {
        return res.status(400).json({ message: "Fornecedor é obrigatório." });
      }

      const payload = {
        descricao: (descricao ?? "").trim() || null,
        valor: Number(valor) || 0,
        desconto: Number(desconto) || 0,
        tipoDesconto,
        valorTotal: Number(valorTotal) || Number(valor) || 0,
        vencimento: normalizeDate(vencimento),
        fornecedorId: fornecedorId || null,
        centroCustoId: centroCustoId || null,
        status: "aberto",
      };

      // injeta empresaId se existir a coluna
      if (ContaPagar?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }

      const nova = await ContaPagar.create(payload);

      const criada = await ContaPagar.findOne({
        where: scopedWhere(ContaPagar, req, { id: nova.id }),
        include: basicIncludes(db),
      });

      return res.status(201).json(criada);
    } catch (error) {
      console.error("Erro ao criar conta a pagar:", error);
      return res.status(500).json({ message: "Erro ao criar conta a pagar." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaPagar, req, { id: Number(id) });
      const conta = await ContaPagar.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta a pagar não encontrada." });
      if (conta.status === "pago") {
        return res
          .status(400)
          .json({ message: "Não é possível alterar uma conta paga." });
      }

      const {
        descricao,
        valor,
        desconto = 0,
        tipoDesconto = "valor",
        valorTotal,
        vencimento,
        fornecedorId,
        centroCustoId,
      } = req.body || {};

      const updates = {
        descricao: (descricao ?? "").trim() || null,
        valor: Number(valor) || 0,
        desconto: Number(desconto) || 0,
        tipoDesconto,
        valorTotal: Number(valorTotal) || Number(valor) || 0,
        vencimento:
          vencimento !== undefined
            ? normalizeDate(vencimento)
            : conta.vencimento,
        fornecedorId: fornecedorId ?? conta.fornecedorId,
        centroCustoId: centroCustoId ?? conta.centroCustoId,
      };

      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await conta.update(updates);

      const atualizada = await ContaPagar.findOne({
        where: scopedWhere(ContaPagar, req, { id: conta.id }),
        include: basicIncludes(db),
      });

      return res.json(atualizada);
    } catch (error) {
      console.error("Erro ao atualizar conta a pagar:", error);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar conta a pagar." });
    }
  },

  async baixar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaPagar, req, { id: Number(id) });
      const conta = await ContaPagar.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta a pagar não encontrada." });
      if (conta.status === "pago")
        return res.status(400).json({ message: "Conta já está paga." });

      const {
        dataPagamento,
        formaPagamento, // 'dinheiro' | 'pix' | 'debito' | 'credito' | 'transferencia'
        contaBancaria, // { id, ... } quando pix/debito
        tipoCredito, // 'avista' | 'parcelado'
        parcelas, // número se parcelado
        valorPago, // número
        novaDataVencimento, // obrigatório se parcial
      } = req.body || {};

      const pago = Number(valorPago || 0);
      const total = Number(conta.valorTotal || 0);
      if (pago <= 0)
        return res.status(400).json({ message: "Valor pago inválido." });

      // valida conta bancária quando necessário (se model existir)
      let contaBancariaId = null;
      if (
        (formaPagamento === "pix" || formaPagamento === "debito") &&
        contaBancaria?.id &&
        db.ContaBancaria
      ) {
        const cbWhere = scopedWhere(db.ContaBancaria, req, {
          id: Number(contaBancaria.id),
        });
        const cb = await db.ContaBancaria.findOne({ where: cbWhere });
        if (!cb)
          return res.status(400).json({ message: "Conta bancária inválida." });
        contaBancariaId = cb.id;
      }

      const diff = Number((total - pago).toFixed(2));

      await conta.update({
        status: "pago",
        dataPagamento: dataPagamento
          ? new Date(normalizeDate(dataPagamento))
          : new Date(),
        formaPagamento: formaPagamento || null,
        contaBancariaId: contaBancariaId || null,
        tipoCredito: formaPagamento === "credito" ? tipoCredito || null : null,
        parcelas:
          formaPagamento === "credito" && tipoCredito === "parcelado"
            ? Number(parcelas || 1)
            : null,
        valorPago: pago,
        troco: pago > total ? Number((pago - total).toFixed(2)) : 0,
      });

      // parcial: gera novo título com saldo
      if (diff > 0) {
        if (!novaDataVencimento) {
          return res.status(400).json({
            message:
              "Nova data de vencimento é obrigatória para pagamento parcial.",
          });
        }

        const novoPayload = {
          descricao: conta.descricao,
          valor: diff,
          desconto: 0,
          tipoDesconto: "valor",
          valorTotal: diff,
          vencimento: normalizeDate(novaDataVencimento),
          fornecedorId: conta.fornecedorId,
          centroCustoId: conta.centroCustoId,
          status: "aberto",
        };
        if (ContaPagar?.rawAttributes?.empresaId && req.empresaId) {
          novoPayload.empresaId = req.empresaId;
        }

        await ContaPagar.create(novoPayload);
      }

      const devolve = await ContaPagar.findOne({
        where: scopedWhere(ContaPagar, req, { id: conta.id }),
        include: basicIncludes(db),
      });

      return res.json(devolve);
    } catch (error) {
      console.error("Erro ao baixar conta a pagar:", error);
      return res.status(500).json({ message: "Erro ao baixar conta a pagar." });
    }
  },

  async estornar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaPagar, req, { id: Number(id) });
      const conta = await ContaPagar.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta a pagar não encontrada." });
      if (conta.status !== "pago")
        return res
          .status(400)
          .json({ message: "Conta não está paga para estornar." });

      await conta.update({
        status: "aberto",
        dataPagamento: null,
        formaPagamento: null,
        contaBancariaId: null,
        tipoCredito: null,
        parcelas: null,
        valorPago: null,
        troco: null,
      });

      const devolve = await ContaPagar.findOne({
        where: scopedWhere(ContaPagar, req, { id: conta.id }),
        include: basicIncludes(db),
      });

      return res.json(devolve);
    } catch (error) {
      console.error("Erro ao estornar conta a pagar:", error);
      return res
        .status(500)
        .json({ message: "Erro ao estornar conta a pagar." });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaPagar = db.ContaPagar;
      if (!ContaPagar) {
        return res
          .status(500)
          .json({ message: "Modelo ContaPagar não carregado no tenant." });
      }

      const { id } = req.params;
      const where = scopedWhere(ContaPagar, req, { id: Number(id) });
      const conta = await ContaPagar.findOne({ where });
      if (!conta)
        return res
          .status(404)
          .json({ message: "Conta a pagar não encontrada." });
      if (conta.status === "pago")
        return res
          .status(400)
          .json({ message: "Não é possível excluir uma conta paga." });

      await conta.destroy();
      return res.json({ message: "Conta a pagar excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir conta a pagar:", error);
      return res
        .status(500)
        .json({ message: "Erro ao excluir conta a pagar." });
    }
  },
};
