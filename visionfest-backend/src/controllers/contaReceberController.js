// src/controllers/contaReceberController.js
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");
const { atualizarStatusContratoSePago } = require("../utils/financeiro");

// Pega o DB do tenant (usa o já setado pelo middleware se houver)
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// dd/mm/aaaa -> aaaa-mm-dd (mantém ISO se já estiver)
function normalizeDate(d) {
  if (!d || typeof d !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d;
  const [dd, mm, yyyy] = d.split("/");
  if (dd && mm && yyyy)
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  return d;
}

// Escopo por empresaId somente se a coluna existir
function scopedWhere(Model, req, base = {}) {
  const where = { ...base };
  if (Model?.rawAttributes?.empresaId && req.empresaId)
    where.empresaId = req.empresaId;
  return where;
}

// Calcula valorTotal com segurança
function calcularValorTotal(valor = 0, desconto = 0, tipoDesconto = "valor") {
  const v = Number(valor) || 0;
  const d = Number(desconto) || 0;
  return tipoDesconto === "percentual"
    ? Math.max(v - (v * d) / 100, 0)
    : Math.max(v - d, 0);
}

const hasAssoc = (Model, alias) => Boolean(Model?.associations?.[alias]);

// Includes para LISTAGEM (sem cartaoCredito)
function includesList(db, ContaReceber) {
  const inc = [];
  if (hasAssoc(ContaReceber, "centroReceita") && db.CentroCusto) {
    inc.push({
      model: db.CentroCusto,
      as: "centroReceita",
      attributes: ["id", "descricao", "tipo"],
    });
  }
  if (hasAssoc(ContaReceber, "contaBancaria") && db.ContaBancaria) {
    inc.push({
      model: db.ContaBancaria,
      as: "contaBancaria",
      attributes: ["id", "banco", "agencia", "conta"],
    });
  }
  if (hasAssoc(ContaReceber, "cliente") && db.Cliente) {
    inc.push({ model: db.Cliente, as: "cliente", attributes: ["id", "nome"] });
  }
  return inc;
}

// Includes para DETALHE (pode incluir cartaoCredito se existir)
function includesDetail(db, ContaReceber) {
  const inc = includesList(db, ContaReceber);
  if (hasAssoc(ContaReceber, "cartaoCredito") && db.CartaoCredito) {
    inc.push({
      model: db.CartaoCredito,
      as: "cartaoCredito",
      attributes: ["id", "banco"],
    });
  }
  return inc;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber) {
        console.error(
          "[contasReceber:listar] Model ContaReceber não encontrado no tenant."
        );
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });
      }

      const { dataInicio, dataFim, clienteId } = req.query || {};
      const di = normalizeDate(dataInicio);
      const df = normalizeDate(dataFim);

      const where = scopedWhere(ContaReceber, req);
      if (di && df) where.vencimento = { [Op.between]: [di, df] };
      if (clienteId) where.clienteId = Number(clienteId);

      const contas = await ContaReceber.findAll({
        where,
        include: includesList(db, ContaReceber),
        order: [
          ["vencimento", "ASC"],
          ["createdAt", "ASC"],
        ],
      });

      res.json(contas);
    } catch (err) {
      console.error("Erro ao listar contas a receber:", err);
      res.status(500).json({ message: "Erro ao listar contas a receber." });
    }
  },

  async obterPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber)
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });

      const { id } = req.params;
      const where = scopedWhere(ContaReceber, req, { id: Number(id) });

      const conta = await ContaReceber.findOne({
        where,
        include: includesDetail(db, ContaReceber),
      });

      if (!conta)
        return res.status(404).json({ message: "Conta não encontrada." });
      res.json(conta);
    } catch (err) {
      console.error("Erro ao buscar conta a receber:", err);
      res.status(500).json({ message: "Erro ao buscar conta a receber." });
    }
  },

  async criar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber)
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });

      const {
        descricao,
        clienteId,
        centroCustoId,
        vencimento,
        valor = 0,
        desconto = 0,
        tipoDesconto = "valor",
        contratoId,
      } = req.body || {};

      if (!descricao)
        return res.status(400).json({ message: "Descrição é obrigatória." });

      const payload = {
        descricao: (descricao ?? "").trim() || null,
        clienteId: clienteId || null,
        centroCustoId: centroCustoId || null,
        vencimento: normalizeDate(vencimento),
        valor: Number(valor) || 0,
        desconto: Number(desconto) || 0,
        tipoDesconto,
        valorTotal: calcularValorTotal(valor, desconto, tipoDesconto),
        status: "aberto",
        contratoId: contratoId || null,
      };
      if (ContaReceber?.rawAttributes?.empresaId && req.empresaId)
        payload.empresaId = req.empresaId;

      const nova = await ContaReceber.create(payload);
      const criada = await ContaReceber.findOne({
        where: scopedWhere(ContaReceber, req, { id: nova.id }),
        include: includesDetail(db, ContaReceber),
      });

      res.status(201).json(criada);
    } catch (e) {
      console.error("Erro ao criar conta a receber:", e);
      res.status(500).json({ message: "Erro ao criar conta a receber." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber)
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });

      const { id } = req.params;
      const where = scopedWhere(ContaReceber, req, { id: Number(id) });
      const conta = await ContaReceber.findOne({ where });
      if (!conta)
        return res.status(404).json({ message: "Conta não encontrada." });
      if (conta.status === "pago")
        return res
          .status(400)
          .json({ message: "Não é possível alterar uma conta já paga." });

      const {
        descricao,
        clienteId,
        centroCustoId,
        vencimento,
        valor = 0,
        desconto = 0,
        tipoDesconto = "valor",
      } = req.body || {};

      const updates = {
        descricao: (descricao ?? "").trim() || null,
        clienteId: clienteId ?? conta.clienteId,
        centroCustoId: centroCustoId ?? conta.centroCustoId,
        vencimento:
          vencimento !== undefined
            ? normalizeDate(vencimento)
            : conta.vencimento,
        valor: Number(valor) || 0,
        desconto: Number(desconto) || 0,
        tipoDesconto,
        valorTotal: calcularValorTotal(valor, desconto, tipoDesconto),
      };
      Object.keys(updates).forEach(
        (k) => updates[k] === undefined && delete updates[k]
      );

      await conta.update(updates);
      const atualizada = await ContaReceber.findOne({
        where: scopedWhere(ContaReceber, req, { id: conta.id }),
        include: includesDetail(db, ContaReceber),
      });

      res.json(atualizada);
    } catch (e) {
      console.error("Erro ao atualizar conta a receber:", e);
      res.status(500).json({ message: "Erro ao atualizar conta a receber." });
    }
  },

  async receber(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber)
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });

      const { id } = req.params;
      const where = scopedWhere(ContaReceber, req, { id: Number(id) });
      const conta = await ContaReceber.findOne({ where });
      if (!conta)
        return res.status(404).json({ message: "Conta não encontrada." });
      if (conta.status === "pago")
        return res
          .status(400)
          .json({ message: "Conta já está recebida/paga." });

      const {
        dataRecebimento,
        formaPagamento,
        contaBancariaId,
        tipoCredito,
        parcelas,
        valorRecebido,
        novaDataVencimento,
        cartaoId,
        taxaRepassada,
        maquina,
      } = req.body || {};

      const recebido = Number(valorRecebido || 0);
      const total = Number(conta.valorTotal || 0);
      if (recebido <= 0)
        return res.status(400).json({ message: "Valor recebido inválido." });

      // valida conta bancária, se houver model e id
      let contaBancariaValida = null;
      if (contaBancariaId && db.ContaBancaria) {
        const cb = await db.ContaBancaria.findOne({
          where: scopedWhere(db.ContaBancaria, req, {
            id: Number(contaBancariaId),
          }),
        });
        if (!cb)
          return res.status(400).json({ message: "Conta bancária inválida." });
        contaBancariaValida = cb.id;
      }

      const updateData = {
        dataRecebimento: dataRecebimento
          ? new Date(normalizeDate(dataRecebimento))
          : new Date(),
        formaPagamento: formaPagamento || null,
        contaBancariaId: contaBancariaValida || null,
        cartaoId: cartaoId || null,
        valorRecebido: recebido,
        tipoCredito: formaPagamento === "credito" ? tipoCredito || null : null,
        parcelas:
          formaPagamento === "credito" && tipoCredito === "parcelado"
            ? Number(parcelas || 1)
            : null,
        taxaRepassada: !!taxaRepassada,
        status: "pago",
      };
      if (ContaReceber.rawAttributes?.maquina)
        updateData.maquina = maquina || null;

      await conta.update(updateData);

      // Parcial -> cria novo título
      const resto = Number((total - recebido).toFixed(2));
      if (resto > 0) {
        if (!novaDataVencimento) {
          return res.status(400).json({
            message:
              "Nova data de vencimento é obrigatória para recebimento parcial.",
          });
        }
        const novoPayload = {
          descricao: `${conta.descricao} (Parcial - Restante)`,
          valor: resto,
          desconto: 0,
          tipoDesconto: "valor",
          valorTotal: resto,
          vencimento: normalizeDate(novaDataVencimento),
          centroCustoId: conta.centroCustoId || null,
          clienteId: conta.clienteId || null,
          contratoId: conta.contratoId || null,
          status: "aberto",
          referenciaId: conta.id,
        };
        if (ContaReceber?.rawAttributes?.empresaId && req.empresaId)
          novoPayload.empresaId = req.empresaId;
        await ContaReceber.create(novoPayload);
      }

      // Atualiza contrato se houver
      if (conta.contratoId) {
        try {
          await atualizarStatusContratoSePago(conta.contratoId, req);
        } catch {}
      }

      const devolve = await ContaReceber.findOne({
        where: scopedWhere(ContaReceber, req, { id: conta.id }),
        include: includesDetail(db, ContaReceber),
      });

      res.json(devolve);
    } catch (e) {
      console.error("Erro ao receber conta a receber:", e);
      res.status(500).json({ message: "Erro ao receber conta a receber." });
    }
  },

  async estornar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber)
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });

      const { id } = req.params;
      const where = scopedWhere(ContaReceber, req, { id: Number(id) });
      const conta = await ContaReceber.findOne({ where });
      if (!conta)
        return res.status(404).json({ message: "Conta não encontrada." });
      if (conta.status !== "pago")
        return res
          .status(400)
          .json({ message: "Só é possível estornar uma conta já paga." });

      const resetData = {
        dataRecebimento: null,
        formaPagamento: null,
        contaBancariaId: null,
        cartaoId: null,
        valorRecebido: null,
        tipoCredito: null,
        parcelas: null,
        taxaRepassada: false,
        status: "aberto",
      };
      if (ContaReceber.rawAttributes?.maquina) resetData.maquina = null;

      await conta.update(resetData);

      const devolve = await ContaReceber.findOne({
        where: scopedWhere(ContaReceber, req, { id: conta.id }),
        include: includesDetail(db, ContaReceber),
      });

      res.json(devolve);
    } catch (e) {
      console.error("Erro ao estornar conta a receber:", e);
      res.status(500).json({ message: "Erro ao estornar conta a receber." });
    }
  },

  async excluir(req, res) {
    try {
      const db = await getDbFromReq(req);
      const ContaReceber = db.ContaReceber;
      if (!ContaReceber)
        return res
          .status(500)
          .json({ message: "Modelo ContaReceber não carregado no tenant." });

      const { id } = req.params;
      const where = scopedWhere(ContaReceber, req, { id: Number(id) });
      const conta = await ContaReceber.findOne({ where });
      if (!conta)
        return res.status(404).json({ message: "Conta não encontrada." });
      if (conta.status === "pago")
        return res
          .status(400)
          .json({ message: "Não é possível excluir uma conta já paga." });

      await conta.destroy();
      return res.sendStatus(204);
    } catch (e) {
      console.error("Erro ao excluir conta a receber:", e);
      res.status(500).json({ message: "Erro ao excluir conta a receber." });
    }
  },

  getFormasPagamento(_req, res) {
    try {
      res.json([
        { id: "dinheiro", nome: "dinheiro" },
        { id: "credito", nome: "credito" },
        { id: "debito", nome: "debito" },
        { id: "pix", nome: "pix" },
        { id: "transferencia", nome: "transferencia" },
        { id: "boleto", nome: "boleto" },
      ]);
    } catch (err) {
      console.error("Erro ao obter formas de pagamento:", err);
      res.status(500).json({ message: "Erro ao obter formas de pagamento." });
    }
  },
};
