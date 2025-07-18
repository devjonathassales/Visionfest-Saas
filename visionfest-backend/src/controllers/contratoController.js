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

function limparCamposVazios(obj) {
  const novoObj = {};
  for (const key in obj) {
    novoObj[key] = obj[key] === "" ? null : obj[key];
  }
  return novoObj;
}

const contratoController = {
  async listar(req, res) {
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
          { model: Cliente, attributes: ["id", "nome"] },
          {
            model: Produto,
            attributes: ["id", "nome", "valor"],
            through: { attributes: ["quantidade", "dataEvento"] },
          },
        ],
        order: [["dataEvento", "ASC"]],
      });

      res.json(contratos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao listar contratos" });
    }
  },

  async listarAgenda(req, res) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: "Informe dataInicio e dataFim" });
      }

      const contratos = await Contrato.findAll({
        where: {
          dataEvento: {
            [Op.between]: [dataInicio, dataFim],
          },
        },
        include: [
          {
            model: Cliente,
            attributes: ["id", "nome"],
          },
        ],
        order: [["dataEvento", "ASC"], ["horarioInicio", "ASC"]],
      });

      const resposta = contratos.map((c) => ({
        id: c.id,
        cliente: c.Cliente.nome,
        dataEvento: c.dataEvento,
        horaInicio: c.horarioInicio,
        horaFim: c.horarioTermino,
        tema: c.temaFesta,
        endereco: c.localEvento,
      }));

      res.json(resposta);
    } catch (err) {
      console.error("❌ Erro ao listar agenda:", err);
      res.status(500).json({ error: "Erro ao listar agenda" });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const contrato = await Contrato.findByPk(id, {
        include: [
          {
            model: Cliente,
            attributes: ["id", "nome"],
          },
          {
            model: Produto,
            attributes: ["id", "nome", "valor"],
            through: { attributes: ["quantidade", "dataEvento"] },
          },
          {
            model: ContaReceber,
            as: "contasReceber",
          },
        ],
      });

      if (!contrato) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }

      res.json(contrato);
    } catch (err) {
      console.error("❌ Erro ao buscar contrato:", err);
      res.status(500).json({ error: "Erro ao buscar contrato" });
    }
  },

  async criar(req, res) {
    const t = await sequelize.transaction();
    try {
      const dados = limparCamposVazios(req.body);

      const {
        clienteId,
        dataEvento,
        horarioInicio,
        horarioTermino,
        enderecoEvento,
        nomeBuffet,
        corTema,
        produtos,
        valorTotal,
        descontoValor,
        descontoPercentual,
        valorEntrada,
        valorRestante,
        parcelasRestante,
        dataContrato,
      } = dados;

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

      console.log("🆔 Contrato criado com ID:", contrato.id);

      // Salvar produtos relacionados
      if (Array.isArray(produtos) && produtos.length > 0) {
        const produtosParaSalvar = produtos.map((p) => ({
          contratoId: contrato.id,
          produtoId: p.produtoId || p.id,
          quantidade: p.quantidade || 1,
          dataEvento: dataEvento,
        }));

        await ContratoProduto.bulkCreate(produtosParaSalvar, {
          transaction: t,
        });
      }

      // Gerar contas a receber
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
          {
            model: Produto,
            through: { attributes: ["quantidade", "dataEvento"] },
          },
        ],
      });

      res.status(201).json(contratoCompleto);
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Erro ao criar contrato" });
    }
  },

  async atualizar(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const dados = limparCamposVazios(req.body);

      const contrato = await Contrato.findByPk(id);
      if (!contrato) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }

      await contrato.update(dados, { transaction: t });

      // Atualizar produtos
      if (Array.isArray(dados.produtos) && dados.produtos.length > 0) {
        await ContratoProduto.destroy({
          where: { contratoId: contrato.id },
          transaction: t,
        });

        const produtosParaSalvar = dados.produtos.map((p) => ({
          contratoId: contrato.id,
          produtoId: p.produtoId || p.id,
          quantidade: p.quantidade || 1,
          dataEvento: dados.dataEvento,
        }));

        await ContratoProduto.bulkCreate(produtosParaSalvar, {
          transaction: t,
        });
      }

      // Atualizar contas a receber
      await ContaReceber.destroy({
        where: { contratoId: id },
        transaction: t,
      });

      const [centroContrato] = await CentroCusto.findOrCreate({
        where: { descricao: "Contratos" },
        defaults: { tipo: "Receita" },
        transaction: t,
      });

      await gerarContasReceberContrato(
        contrato,
        {
          clienteId: dados.clienteId,
          centroCustoId: centroContrato.id,
          valorEntrada: dados.valorEntrada,
          dataContrato: dados.dataContrato,
          valorRestante: dados.valorRestante,
          parcelasRestante: dados.parcelasRestante,
        },
        t
      );

      await t.commit();

      const contratoAtualizado = await Contrato.findByPk(contrato.id, {
        include: [
          { model: Cliente, attributes: ["id", "nome"] },
          {
            model: Produto,
            through: { attributes: ["quantidade", "dataEvento"] },
          },
        ],
      });

      res.json(contratoAtualizado);
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar contrato" });
    }
  },

  async excluir(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;

      const contrato = await Contrato.findByPk(id);
      if (!contrato) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }

      await ContaReceber.destroy({
        where: { contratoId: id },
        transaction: t,
      });
      await ContratoProduto.destroy({
        where: { contratoId: id },
        transaction: t,
      });
      await contrato.destroy({ transaction: t });

      await t.commit();
      res.json({ message: "Contrato e dependências excluídos com sucesso" });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir contrato" });
    }
  },
};

module.exports = contratoController;
