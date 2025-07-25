const { Produto } = require("../models");

module.exports = {
  async listar(req, res) {
    try {
      const produtos = await Produto.findAll({ order: [["nome", "ASC"]] });
      res.json(produtos);
    } catch (err) {
      console.error("Erro ao listar produtos:", err);
      res.status(500).json({ error: "Erro ao listar produtos." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.findByPk(id);
      if (!produto) return res.status(404).json({ error: "Produto não encontrado." });
      res.json(produto);
    } catch (err) {
      console.error("Erro ao buscar produto:", err);
      res.status(500).json({ error: "Erro ao buscar produto." });
    }
  },

  async criar(req, res) {
    try {
      const produto = await Produto.create(req.body);
      res.status(201).json(produto);
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      res.status(500).json({ error: "Erro ao criar produto." });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.findByPk(id);
      if (!produto) return res.status(404).json({ error: "Produto não encontrado." });

      await produto.update(req.body);
      res.json(produto);
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      res.status(500).json({ error: "Erro ao atualizar produto." });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.findByPk(id);
      if (!produto) return res.status(404).json({ error: "Produto não encontrado." });

      await produto.destroy();
      res.json({ message: "Produto excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      res.status(500).json({ error: "Erro ao excluir produto." });
    }
  },
};
