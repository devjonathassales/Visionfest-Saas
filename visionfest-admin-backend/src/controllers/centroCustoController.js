const { CentroCusto } = require("../models");

module.exports = {
  async listar(req, res) {
    try {
      const centros = await CentroCusto.findAll({ order: [["descricao", "ASC"]] });
      res.json(centros);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao listar centros de custo" });
    }
  },

  async criar(req, res) {
    try {
      const { descricao, tipo } = req.body;

      // Verificar duplicidade
      const existente = await CentroCusto.findOne({ where: { descricao } });
      if (existente) {
        return res.status(400).json({ error: "Já existe um centro com essa descrição." });
      }

      const centro = await CentroCusto.create({ descricao, tipo });
      res.status(201).json(centro);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao criar centro de custo" });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { descricao, tipo } = req.body;

      const centro = await CentroCusto.findByPk(id);
      if (!centro) {
        return res.status(404).json({ error: "Centro de custo não encontrado" });
      }

      // Verificar duplicidade em outros registros
      const duplicado = await CentroCusto.findOne({
        where: { descricao, id: { [Op.ne]: id } },
      });
      if (duplicado) {
        return res.status(400).json({ error: "Já existe outro centro com essa descrição." });
      }

      centro.descricao = descricao;
      centro.tipo = tipo;
      await centro.save();

      res.json(centro);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar centro de custo" });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;

      const centro = await CentroCusto.findByPk(id, {
        include: [{ model: Lancamento, as: "lancamentos" }],
      });

      if (!centro) {
        return res.status(404).json({ error: "Centro de custo não encontrado" });
      }

      if (centro.lancamentos.length > 0) {
        return res.status(400).json({
          error: "Não é possível excluir. Existem lançamentos vinculados a este centro.",
        });
      }

      await centro.destroy();
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir centro de custo" });
    }
  },
};
