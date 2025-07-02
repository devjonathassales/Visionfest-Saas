const {
  Contrato,
  Cliente,
  Produto,
  ContratoProduto,
  ContaReceber,
  CentroCusto,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { gerarContasReceberContrato } = require("../utils/financeiro");

module.exports = {
  listar: async (req, res) => {
    try {
      const { cliente, dataInicio, dataFim } = req.query;
      const where = {};

      if (cliente) {
        const clientes = await Cliente.findAll({
          where: { nome: { [Op.iLike]: `%${cliente}%` } },
          attributes: ["id"],
        });
        where.clienteId = { [Op.in]: clientes.map((c) => c.id) };
      }

      if (dataInicio && dataFim) {
        where.dataEvento = { [Op.between]: [dataInicio, dataFim] };
      }

      const contratos = await Contrato.findAll({
        where,
        include: [
          { model: Cliente, attributes: ["nome"] },
          { model: Produto, through: { attributes: ["quantidade"] } },
        ],
        order: [["dataEvento", "ASC"]],
      });

      res.json(contratos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao listar contratos" });
    }
  },

  criar: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        clienteId,
        dataEvento,
        horarioInicio,
        horarioTermino,
        enderecoEvento,
        nomeBuffet,
        corTema,
        produtosSelecionados,
        valorTotal,
        descontoValor,
        descontoPercentual,
        valorEntrada,
        valorRestante,
        parcelasRestante,
        dataContrato,
      } = req.body;

      const [centroContrato] = await CentroCusto.findOrCreate({
        where: { descricao: "Contratos" },
        defaults: { tipo: "Receita" },
        transaction: t,
      });

      const contrato = await Contrato.create(
        {
          clienteId,
          dataEvento,
          horarioInicio,
          horarioTermino,
          localEvento: enderecoEvento,
          nomeBuffet,
          temaFesta: corTema,
          valorTotal,
          descontoValor,
          descontoPercentual,
          valorEntrada,
          valorRestante,
          parcelasRestante,
          dataContrato,
          statusPagamento:
            valorEntrada >= valorTotal
              ? "Totalmente Pago"
              : valorEntrada > 0
              ? "Parcialmente Pago"
              : "Aberto",
        },
        { transaction: t }
      );

      await contrato.reload({ transaction: t });

      if (
        Array.isArray(produtosSelecionados) &&
        produtosSelecionados.length > 0
      ) {
        for (const p of produtosSelecionados) {
          await ContratoProduto.create(
            {
              contratoId: contrato.id,
              produtoId: p.produtoId,
              quantidade: p.quantidade || 1,
              dataEvento,
            },
            { transaction: t }
          );
        }
      }

      await gerarContasReceberContrato(
        contrato,
        {
          clienteId,
          centroCustoId: centroContrato.id,
          valorEntrada,
          dataContrato,
          valorRestante,
          parcelasRestante,
        },
        t
      );

      await t.commit();

      const contratoCompleto = await Contrato.findByPk(contrato.id, {
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          { model: Produto, through: { attributes: ["quantidade"] } },
        ],
      });

      res.status(201).json(contratoCompleto);
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Erro ao criar contrato" });
    }
  },

  atualizar: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const id = req.params.id;
      const {
        clienteId,
        dataEvento,
        horarioInicio,
        horarioTermino,
        enderecoEvento,
        nomeBuffet,
        corTema,
        produtosSelecionados,
        valorTotal,
        descontoValor,
        descontoPercentual,
        valorEntrada,
        valorRestante,
        parcelasRestante,
        dataContrato,
      } = req.body;

      const contrato = await Contrato.findByPk(id);
      if (!contrato)
        return res.status(404).json({ error: "Contrato não encontrado" });

      const [centroContrato] = await CentroCusto.findOrCreate({
        where: { descricao: "Contratos" },
        defaults: { tipo: "Receita" },
        transaction: t,
      });

      await contrato.update(
        {
          clienteId,
          dataEvento,
          horarioInicio,
          horarioTermino,
          localEvento: enderecoEvento,
          nomeBuffet,
          temaFesta: corTema,
          valorTotal,
          descontoValor,
          descontoPercentual,
          valorEntrada,
          valorRestante,
          parcelasRestante,
          dataContrato,
          statusPagamento:
            valorEntrada >= valorTotal
              ? "Totalmente Pago"
              : valorEntrada > 0
              ? "Parcialmente Pago"
              : "Aberto",
        },
        { transaction: t }
      );

      await ContratoProduto.destroy({
        where: { contratoId: id },
        transaction: t,
      });

      if (
        Array.isArray(produtosSelecionados) &&
        produtosSelecionados.length > 0
      ) {
        for (const p of produtosSelecionados) {
          await ContratoProduto.create(
            {
              contratoId: contrato.id,
              produtoId: p.produtoId,
              quantidade: p.quantidade || 1,
              dataEvento,
            },
            { transaction: t }
          );
        }
      }

      await ContaReceber.destroy({ where: { contratoId: id }, transaction: t });

      await gerarContasReceberContrato(
        contrato,
        {
          clienteId,
          centroCustoId: centroContrato.id,
          valorEntrada,
          dataContrato,
          valorRestante,
          parcelasRestante,
        },
        t
      );

      await t.commit();

      const contratoAtualizado = await Contrato.findByPk(contrato.id, {
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          { model: Produto, through: { attributes: ["quantidade"] } },
        ],
      });

      res.json(contratoAtualizado);
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar contrato" });
    }
  },

  excluir: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const id = req.params.id;
      const contrato = await Contrato.findByPk(id);
      if (!contrato)
        return res.status(404).json({ error: "Contrato não encontrado" });

      await ContratoProduto.destroy({
        where: { contratoId: id },
        transaction: t,
      });

      await ContaReceber.destroy({ where: { contratoId: id }, transaction: t });

      await contrato.destroy({ transaction: t });

      await t.commit();
      res.json({ message: "Contrato excluído com sucesso" });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir contrato" });
    }
  },

  buscarPorId: async (req, res) => {
    try {
      const id = req.params.id;
      const contrato = await Contrato.findByPk(id, {
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          { model: Produto, through: { attributes: ["quantidade"] } },
          { model: ContaReceber, as: "contasReceber" },
        ],
      });

      if (!contrato)
        return res.status(404).json({ error: "Contrato não encontrado" });

      res.json(contrato);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar contrato" });
    }
  },
};
