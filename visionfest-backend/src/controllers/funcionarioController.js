const { Funcionario } = require("../models");

module.exports = {
  async listar(req, res) {
    try {
      const funcionarios = await Funcionario.findAll({
        order: [["nome", "ASC"]],
      });
      res.json(funcionarios);
    } catch (err) {
      console.error("Erro ao listar funcionários:", err);
      res.status(500).json({ erro: "Erro ao listar funcionários." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const funcionario = await Funcionario.findByPk(id);
      if (!funcionario)
        return res.status(404).json({ erro: "Funcionário não encontrado." });
      res.json(funcionario);
    } catch (err) {
      console.error("Erro ao buscar funcionário:", err);
      res.status(500).json({ erro: "Erro ao buscar funcionário." });
    }
  },

  async criar(req, res) {
    try {
      const funcionario = await Funcionario.create(req.body);
      res.status(201).json(funcionario);
    } catch (err) {
      console.error("Erro ao criar funcionário:", err);
      res
        .status(400)
        .json({ erro: "Erro ao criar funcionário.", detalhes: err.message });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const funcionario = await Funcionario.findByPk(id);
      if (!funcionario)
        return res.status(404).json({ erro: "Funcionário não encontrado." });

      await funcionario.update(req.body);
      res.json(funcionario);
    } catch (err) {
      console.error("Erro ao atualizar funcionário:", err);
      res
        .status(400)
        .json({
          erro: "Erro ao atualizar funcionário.",
          detalhes: err.message,
        });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const funcionario = await Funcionario.findByPk(id);
      if (!funcionario)
        return res.status(404).json({ erro: "Funcionário não encontrado." });

      await funcionario.destroy();
      res.json({ mensagem: "Funcionário excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir funcionário:", err);
      res.status(500).json({ erro: "Erro ao excluir funcionário." });
    }
  },
};
