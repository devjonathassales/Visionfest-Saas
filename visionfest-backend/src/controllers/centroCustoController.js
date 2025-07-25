const { getDbCliente } = require("../utils/multiTenant");

module.exports = {
  async listar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CentroCusto } = db.models;

      const centros = await CentroCusto.findAll({
        where: { empresaId: req.empresaId },
        order: [["descricao", "ASC"]],
      });
      res.json(centros);
    } catch (error) {
      console.error("Erro ao listar centros de custo:", error);
      res.status(500).json({ error: "Erro ao listar centros de custo." });
    }
  },

  async criar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CentroCusto } = db.models;

      const { descricao, tipo } = req.body;
      if (!descricao || !tipo) {
        return res.status(400).json({ error: "Descrição e tipo são obrigatórios." });
      }

      const novo = await CentroCusto.create({
        descricao,
        tipo,
        empresaId: req.empresaId,
      });
      res.status(201).json(novo);
    } catch (error) {
      console.error("Erro ao criar centro de custo:", error);
      res.status(500).json({ error: "Erro ao criar centro de custo." });
    }
  },

  async atualizar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CentroCusto } = db.models;

      const { id } = req.params;
      const centro = await CentroCusto.findOne({
        where: { id, empresaId: req.empresaId },
      });

      if (!centro) return res.status(404).json({ error: "Centro de custo não encontrado." });

      const { descricao, tipo } = req.body;
      await centro.update({ descricao, tipo });
      res.json(centro);
    } catch (error) {
      console.error("Erro ao atualizar centro de custo:", error);
      res.status(500).json({ error: "Erro ao atualizar centro de custo." });
    }
  },

  async excluir(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CentroCusto } = db.models;

      const { id } = req.params;
      const centro = await CentroCusto.findOne({
        where: { id, empresaId: req.empresaId },
      });

      if (!centro) return res.status(404).json({ error: "Centro de custo não encontrado." });

      await centro.destroy();
      res.json({ mensagem: "Centro de custo excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir centro de custo:", error);
      res.status(500).json({ error: "Erro ao excluir centro de custo." });
    }
  },
};
