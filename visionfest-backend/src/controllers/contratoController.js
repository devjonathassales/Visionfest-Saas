const {
  Contrato,
  Cliente,
  Produto,
  ContratoProduto,
  ContaReceber,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

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
        const clientesIds = clientes.map((c) => c.id);
        where.clienteId = { [Op.in]: clientesIds };
      }

      if (dataInicio && dataFim) {
        where.dataEvento = {
          [Op.between]: [dataInicio, dataFim],
        };
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
        localEvento,
        nomeBuffet,
        temaFesta,
        produtos, // array [{produtoId, quantidade}]
        valorTotal,
        descontoValor,
        descontoPercentual,
        valorEntrada,
        valorRestante,
        parcelasRestante,
        dataContrato,
      } = req.body;

      // Criar contrato
      const contrato = await Contrato.create(
        {
          clienteId,
          dataEvento,
          horarioInicio,
          horarioTermino,
          localEvento,
          nomeBuffet,
          temaFesta,
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

      // Associar produtos com quantidade
      if (produtos && produtos.length) {
        for (const p of produtos) {
          await ContratoProduto.create(
            {
              contratoId: contrato.id,
              produtoId: p.produtoId,
              quantidade: p.quantidade || 1,
              dataEvento: dataEvento,
            },
            { transaction: t }
          );
        }
      }

      // Criar contas a receber para entrada e restante
      if (valorEntrada > 0) {
        await ContaReceber.create(
          {
            descricao: `Entrada do contrato #${contrato.id}`,
            valor: valorEntrada,
            valorTotal: valorEntrada,
            vencimento: dataContrato, // pode usar dataContrato como vencimento da entrada
            status: "pago", // entrada já paga
            clienteId,
            contratoId: contrato.id,
            dataRecebimento: new Date(),
          },
          { transaction: t }
        );
      }

      if (valorRestante > 0) {
        await ContaReceber.create(
          {
            descricao: `Saldo restante do contrato #${contrato.id}`,
            valor: valorRestante,
            valorTotal: valorRestante,
            vencimento:
              parcelasRestante && parcelasRestante.length > 0
                ? parcelasRestante[0].vencimento
                : dataContrato,
            status: "aberto",
            clienteId,
            contratoId: contrato.id,
          },
          { transaction: t }
        );
      }

      await t.commit();

      res.status(201).json(contrato);
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
        localEvento,
        nomeBuffet,
        temaFesta,
        produtos,
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

      await contrato.update(
        {
          clienteId,
          dataEvento,
          horarioInicio,
          horarioTermino,
          localEvento,
          nomeBuffet,
          temaFesta,
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

      // Atualizar produtos: remover antigos e inserir novos
      await ContratoProduto.destroy({
        where: { contratoId: id },
        transaction: t,
      });
      if (produtos && produtos.length) {
        for (const p of produtos) {
          await ContratoProduto.create(
            {
              contratoId: contrato.id,
              produtoId: p.produtoId,
              quantidade: p.quantidade || 1,
              dataEvento: dataEvento,
            },
            { transaction: t }
          );
        }
      }

      // Atualizar contas a receber: remover antigas e recriar
      await ContaReceber.destroy({ where: { contratoId: id }, transaction: t });

      if (valorEntrada > 0) {
        await ContaReceber.create(
          {
            descricao: `Entrada do contrato #${contrato.id}`,
            valor: valorEntrada,
            valorTotal: valorEntrada,
            vencimento: dataContrato,
            status: "pago",
            clienteId,
            contratoId: contrato.id,
            dataRecebimento: new Date(),
          },
          { transaction: t }
        );
      }

      if (valorRestante > 0) {
        await ContaReceber.create(
          {
            descricao: `Saldo restante do contrato #${contrato.id}`,
            valor: valorRestante,
            valorTotal: valorRestante,
            vencimento:
              parcelasRestante && parcelasRestante.length > 0
                ? parcelasRestante[0].vencimento
                : dataContrato,
            status: "aberto",
            clienteId,
            contratoId: contrato.id,
          },
          { transaction: t }
        );
      }

      await t.commit();

      res.json(contrato);
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
