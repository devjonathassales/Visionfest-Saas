const { getDbCliente } = require("../utils/tenant");

module.exports = {
  async listar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CartaoCredito } = db.models;

      const cartoes = await CartaoCredito.findAll({
        where: { empresaId: req.empresaId },
      });
      res.json(cartoes);
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
      res.status(500).json({ error: "Erro ao buscar cartões" });
    }
  },

  async criar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CartaoCredito } = db.models;

      const { banco, taxaVista, taxaParcelado, taxaDebito } = req.body;
      if (!banco) return res.status(400).json({ error: "Banco é obrigatório" });

      const novo = await CartaoCredito.create({
        banco,
        taxaVista,
        taxaParcelado,
        taxaDebito,
        empresaId: req.empresaId,
      });
      res.status(201).json(novo);
    } catch (error) {
      console.error("Erro ao criar cartão:", error);
      res.status(500).json({ error: "Erro ao criar cartão" });
    }
  },

  async atualizar(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CartaoCredito } = db.models;

      const { id } = req.params;
      const cartao = await CartaoCredito.findOne({
        where: { id, empresaId: req.empresaId },
      });

      if (!cartao) return res.status(404).json({ error: "Cartão não encontrado" });

      const { banco, taxaVista, taxaParcelado, taxaDebito } = req.body;
      await cartao.update({ banco, taxaVista, taxaParcelado, taxaDebito });
      res.json(cartao);
    } catch (error) {
      console.error("Erro ao atualizar cartão:", error);
      res.status(500).json({ error: "Erro ao atualizar cartão" });
    }
  },

  async excluir(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { CartaoCredito } = db.models;

      const { id } = req.params;
      const cartao = await CartaoCredito.findOne({
        where: { id, empresaId: req.empresaId },
      });

      if (!cartao) return res.status(404).json({ error: "Cartão não encontrado" });

      await cartao.destroy();
      res.json({ mensagem: "Cartão excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
      res.status(500).json({ error: "Erro ao excluir cartão" });
    }
  },
};
