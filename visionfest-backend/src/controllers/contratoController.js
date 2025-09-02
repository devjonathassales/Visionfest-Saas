const { Op } = require("sequelize");
const { gerarContasReceberContrato } = require("../utils/financeiro");
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

// Normaliza strings vazias para null (evita sobrescrever com "")
function limparCamposVazios(obj = {}) {
  const out = {};
  for (const k of Object.keys(obj)) out[k] = obj[k] === "" ? null : obj[k];
  return out;
}

module.exports = {
  async listar(req, res) {
    try {
      const db = await getDbFromReq(req);
      const { Contrato, Cliente, Produto, ContratoProduto } = db;

      if (!Contrato || !Cliente || !Produto) {
        console.error("[contratos:listar] Models ausentes no tenant");
        return res
          .status(500)
          .json({ error: "Models não carregados no schema do tenant." });
      }

      const { cliente, dataInicio, dataFim } = req.query || {};
      const where = scopedWhere(Contrato, req);

      if (cliente) {
        // filtra por nome de cliente
        const clientes = await Cliente.findAll({
          where: scopedWhere(Cliente, req, {
            nome: { [Op.iLike]: `%${cliente}%` },
          }),
          attributes: ["id"],
        });
        where.clienteId = { [Op.in]: clientes.map((c) => c.id) };
      }

      if (dataInicio && dataFim && Contrato.rawAttributes?.dataEvento) {
        where.dataEvento = { [Op.between]: [dataInicio, dataFim] };
      }

      const order = [];
      if (Contrato.rawAttributes?.dataEvento) order.push(["dataEvento", "ASC"]);
      if (Contrato.rawAttributes?.createdAt) order.push(["createdAt", "ASC"]);
      if (order.length === 0 && Contrato.rawAttributes?.id)
        order.push(["id", "ASC"]);

      const contratos = await Contrato.findAll({
        where,
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          {
            model: Produto,
            attributes: ["id", "nome", "valor"],
            through: {
              model: ContratoProduto,
              attributes: ["quantidade", "dataEvento"],
            },
          },
        ],
        order,
      });

      return res.json(contratos);
    } catch (err) {
      console.error("Erro ao listar contratos:", err);
      return res.status(500).json({ error: "Erro ao listar contratos." });
    }
  },

  async listarAgenda(req, res) {
    try {
      const db = await getDbFromReq(req);
      const { Contrato, Cliente } = db;
      if (!Contrato || !Cliente) {
        return res
          .status(500)
          .json({ error: "Models não carregados no schema do tenant." });
      }

      const { dataInicio, dataFim } = req.query || {};
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: "Informe dataInicio e dataFim." });
      }

      const where = scopedWhere(Contrato, req, {
        ...(Contrato.rawAttributes?.dataEvento
          ? { dataEvento: { [Op.between]: [dataInicio, dataFim] } }
          : {}),
      });

      const order = [];
      if (Contrato.rawAttributes?.dataEvento) order.push(["dataEvento", "ASC"]);
      if (Contrato.rawAttributes?.horarioInicio)
        order.push(["horarioInicio", "ASC"]);

      const contratos = await Contrato.findAll({
        where,
        include: [{ model: Cliente, attributes: ["id", "nome"] }],
        order,
      });

      const resp = contratos.map((c) => ({
        id: c.id,
        cliente: c.Cliente?.nome || "-",
        dataEvento: c.dataEvento ?? null,
        horaInicio: c.horarioInicio ?? null,
        horaFim: c.horarioTermino ?? null,
        tema: c.temaFesta ?? null,
        endereco: c.localEvento ?? null,
      }));

      return res.json(resp);
    } catch (err) {
      console.error("Erro ao listar agenda:", err);
      return res.status(500).json({ error: "Erro ao listar agenda." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const db = await getDbFromReq(req);
      const { Contrato, Cliente, Produto, ContratoProduto, ContaReceber } = db;
      if (!Contrato)
        return res
          .status(500)
          .json({ error: "Model Contrato não carregado no tenant." });

      const where = scopedWhere(Contrato, req, { id: Number(req.params.id) });

      const contrato = await Contrato.findOne({
        where,
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          {
            model: Produto,
            attributes: ["id", "nome", "valor"],
            through: {
              model: ContratoProduto,
              attributes: ["quantidade", "dataEvento"],
            },
          },
          // Só inclui contas se a associação existir nesse tenant
          ...(ContaReceber
            ? [{ model: ContaReceber, as: "contasReceber" }]
            : []),
        ],
      });

      if (!contrato)
        return res.status(404).json({ error: "Contrato não encontrado." });
      return res.json(contrato);
    } catch (err) {
      console.error("Erro ao buscar contrato:", err);
      return res.status(500).json({ error: "Erro ao buscar contrato." });
    }
  },

  async criar(req, res) {
    const tdb = await getDbFromReq(req);
    const {
      Contrato,
      ContratoProduto,
      CentroCusto,
      Cliente,
      Produto,
      ContaReceber,
      sequelize,
    } = tdb;

    const t = await sequelize.transaction();
    try {
      if (!Contrato || !Cliente || !Produto || !ContratoProduto) {
        await t.rollback();
        return res
          .status(500)
          .json({ error: "Models não carregados no schema do tenant." });
      }

      const dados = limparCamposVazios(req.body || {});
      if (!dados.clienteId) {
        await t.rollback();
        return res.status(400).json({ error: "clienteId é obrigatório." });
      }
      if (!Array.isArray(dados.produtos) || dados.produtos.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: "Informe ao menos um produto." });
      }

      const valorEntradaNum = Number(dados.valorEntrada) || 0;
      const valorTotalNum = Number(dados.valorTotal) || 0;

      const payload = {
        ...dados,
      };
      // injeta empresaId se existir a coluna
      if (Contrato?.rawAttributes?.empresaId && req.empresaId) {
        payload.empresaId = req.empresaId;
      }
      // statusPagamento
      payload.statusPagamento =
        valorEntradaNum >= valorTotalNum
          ? "Totalmente Pago"
          : valorEntradaNum > 0
          ? "Parcialmente Pago"
          : "Aberto";

      const contrato = await Contrato.create(payload, { transaction: t });

      // Vincula produtos
      const produtosParaSalvar = dados.produtos.map((p) => ({
        contratoId: contrato.id,
        produtoId: p.produtoId || p.id,
        quantidade: p.quantidade || 1,
        dataEvento: dados.dataEvento || null,
      }));
      await ContratoProduto.bulkCreate(produtosParaSalvar, { transaction: t });

      // Centro de Custo "Contratos"
      let centroContratoId = null;
      if (CentroCusto) {
        const [centroContrato] = await CentroCusto.findOrCreate({
          where: scopedWhere(CentroCusto, req, { descricao: "Contratos" }),
          defaults: scopedWhere(CentroCusto, req, {
            descricao: "Contratos",
            tipo: "Receita",
          }),
          transaction: t,
        });
        centroContratoId = centroContrato?.id ?? null;
      }

      // Gera contas a receber (se util existir)
      if (typeof gerarContasReceberContrato === "function") {
        await gerarContasReceberContrato(
          contrato,
          {
            clienteId: dados.clienteId,
            centroCustoId: centroContratoId,
            valorEntrada: valorEntradaNum,
            dataContrato: dados.dataContrato,
            valorRestante: Number(dados.valorRestante) || 0,
            parcelasRestante: Array.isArray(dados.parcelasRestante)
              ? dados.parcelasRestante
              : [],
          },
          t
        );
      }

      await t.commit();

      const contratoCompleto = await Contrato.findOne({
        where: scopedWhere(Contrato, req, { id: contrato.id }),
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          {
            model: Produto,
            attributes: ["id", "nome", "valor"],
            through: {
              model: ContratoProduto,
              attributes: ["quantidade", "dataEvento"],
            },
          },
        ],
      });

      return res.status(201).json(contratoCompleto);
    } catch (err) {
      await t.rollback();
      console.error("Erro ao criar contrato:", err);
      return res.status(500).json({ error: "Erro ao criar contrato." });
    }
  },

  async atualizar(req, res) {
    const tdb = await getDbFromReq(req);
    const {
      Contrato,
      ContratoProduto,
      ContaReceber,
      CentroCusto,
      Produto,
      Cliente,
      sequelize,
    } = tdb;

    const t = await sequelize.transaction();
    try {
      if (!Contrato || !ContratoProduto) {
        await t.rollback();
        return res
          .status(500)
          .json({ error: "Models não carregados no schema do tenant." });
      }

      const { id } = req.params;
      const dados = limparCamposVazios(req.body || {});
      const where = scopedWhere(Contrato, req, { id: Number(id) });

      const contrato = await Contrato.findOne({ where });
      if (!contrato) {
        await t.rollback();
        return res.status(404).json({ error: "Contrato não encontrado." });
      }

      await contrato.update(dados, { transaction: t });

      // Atualiza produtos (reset + recria)
      await ContratoProduto.destroy({
        where: { contratoId: contrato.id },
        transaction: t,
      });
      const produtosParaSalvar = (
        Array.isArray(dados.produtos) ? dados.produtos : []
      ).map((p) => ({
        contratoId: contrato.id,
        produtoId: p.produtoId || p.id,
        quantidade: p.quantidade || 1,
        dataEvento: dados.dataEvento || null,
      }));
      if (produtosParaSalvar.length > 0) {
        await ContratoProduto.bulkCreate(produtosParaSalvar, {
          transaction: t,
        });
      }

      // Regera contas a receber
      if (ContaReceber) {
        await ContaReceber.destroy({
          where: scopedWhere(ContaReceber, req, { contratoId: contrato.id }),
          transaction: t,
        });
      }

      let centroContratoId = null;
      if (CentroCusto) {
        const [centroContrato] = await CentroCusto.findOrCreate({
          where: scopedWhere(CentroCusto, req, { descricao: "Contratos" }),
          defaults: scopedWhere(CentroCusto, req, {
            descricao: "Contratos",
            tipo: "Receita",
          }),
          transaction: t,
        });
        centroContratoId = centroContrato?.id ?? null;
      }

      if (typeof gerarContasReceberContrato === "function") {
        await gerarContasReceberContrato(
          contrato,
          {
            clienteId: dados.clienteId,
            centroCustoId: centroContratoId,
            valorEntrada: Number(dados.valorEntrada) || 0,
            dataContrato: dados.dataContrato,
            valorRestante: Number(dados.valorRestante) || 0,
            parcelasRestante: Array.isArray(dados.parcelasRestante)
              ? dados.parcelasRestante
              : [],
          },
          t
        );
      }

      await t.commit();

      const contratoAtualizado = await Contrato.findOne({
        where: scopedWhere(Contrato, req, { id: contrato.id }),
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          {
            model: Produto,
            attributes: ["id", "nome", "valor"],
            through: {
              model: tdb.ContratoProduto,
              attributes: ["quantidade", "dataEvento"],
            },
          },
        ],
      });

      return res.json(contratoAtualizado);
    } catch (err) {
      await t.rollback();
      console.error("Erro ao atualizar contrato:", err);
      return res.status(500).json({ error: "Erro ao atualizar contrato." });
    }
  },

  async excluir(req, res) {
    const tdb = await getDbFromReq(req);
    const { Contrato, ContratoProduto, ContaReceber, sequelize } = tdb;

    const t = await sequelize.transaction();
    try {
      if (!Contrato) {
        await t.rollback();
        return res
          .status(500)
          .json({ error: "Model Contrato não carregado no tenant." });
      }

      const where = scopedWhere(Contrato, req, { id: Number(req.params.id) });
      const contrato = await Contrato.findOne({ where });
      if (!contrato) {
        await t.rollback();
        return res.status(404).json({ error: "Contrato não encontrado." });
      }

      if (ContaReceber) {
        await ContaReceber.destroy({
          where: scopedWhere(ContaReceber, req, { contratoId: contrato.id }),
          transaction: t,
        });
      }

      if (ContratoProduto) {
        await ContratoProduto.destroy({
          where: { contratoId: contrato.id },
          transaction: t,
        });
      }

      await contrato.destroy({ transaction: t });
      await t.commit();

      return res.json({
        message: "Contrato e dependências excluídos com sucesso.",
      });
    } catch (err) {
      await t.rollback();
      console.error("Erro ao excluir contrato:", err);
      return res.status(500).json({ error: "Erro ao excluir contrato." });
    }
  },
};
