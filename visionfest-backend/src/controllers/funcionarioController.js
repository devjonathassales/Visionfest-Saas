const { Funcionario } = require('../models');

module.exports = {
  async listar(req, res) {
    try {
      const funcionarios = await Funcionario.findAll({ order: [['nome', 'ASC']] });
      res.json(funcionarios);
    } catch (err) {
      res.status(500).json({ erro: 'Erro ao listar funcionários.' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const funcionario = await Funcionario.findByPk(req.params.id);
      if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });
      res.json(funcionario);
    } catch (err) {
      res.status(500).json({ erro: 'Erro ao buscar funcionário.' });
    }
  },

  async criar(req, res) {
    try {
      const novo = await Funcionario.create(req.body);
      res.status(201).json(novo);
    } catch (err) {
      res.status(400).json({ erro: 'Erro ao criar funcionário.', detalhes: err.message });
    }
  },

  async atualizar(req, res) {
    try {
      const funcionario = await Funcionario.findByPk(req.params.id);
      if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

      await funcionario.update(req.body);
      res.json(funcionario);
    } catch (err) {
      res.status(400).json({ erro: 'Erro ao atualizar funcionário.', detalhes: err.message });
    }
  },

  async excluir(req, res) {
    try {
      const funcionario = await Funcionario.findByPk(req.params.id);
      if (!funcionario) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

      await funcionario.destroy();
      res.json({ mensagem: 'Funcionário excluído com sucesso.' });
    } catch (err) {
      res.status(500).json({ erro: 'Erro ao excluir funcionário.' });
    }
  }
};
