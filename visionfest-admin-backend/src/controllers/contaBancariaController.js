const { ContaBancaria } = require("../models");

module.exports = {
  async listar(req, res) {
    try {
      const contas = await ContaBancaria.findAll();
      res.json(contas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar contas bancárias" });
    }
  },

  async criar(req, res) {
    try {
      const conta = await ContaBancaria.create(req.body);
      res.status(201).json(conta);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao criar conta bancária" });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const conta = await ContaBancaria.findByPk(id);

      if (!conta) {
        return res.status(404).json({ error: "Conta não encontrada" });
      }

      await conta.update(req.body);
      res.json(conta);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar conta bancária" });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const conta = await ContaBancaria.findByPk(id);

      if (!conta) {
        return res.status(404).json({ error: "Conta não encontrada" });
      }

      await conta.destroy();
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir conta bancária" });
    }
  },
};
