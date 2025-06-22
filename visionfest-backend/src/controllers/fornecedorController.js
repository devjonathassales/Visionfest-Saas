// controllers/fornecedorController.js
const { Fornecedor } = require('../models');

module.exports = {
  async listar(req, res) {
    try {
      const fornecedores = await Fornecedor.findAll({ order: [['nome', 'ASC']] });
      res.json(fornecedores);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao listar fornecedores.' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const fornecedor = await Fornecedor.findByPk(id);
      if (!fornecedor) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
      res.json(fornecedor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao buscar fornecedor.' });
    }
  },

  async criar(req, res) {
    try {
      const { nome, cpfCnpj, endereco, whatsapp, email } = req.body;

      // Verifica se cpfCnpj já existe
      const existente = await Fornecedor.findOne({ where: { cpfCnpj } });
      if (existente) return res.status(400).json({ message: 'CPF/CNPJ já cadastrado.' });

      const fornecedor = await Fornecedor.create({ nome, cpfCnpj, endereco, whatsapp, email });
      res.status(201).json(fornecedor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao criar fornecedor.' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, cpfCnpj, endereco, whatsapp, email } = req.body;

      const fornecedor = await Fornecedor.findByPk(id);
      if (!fornecedor) return res.status(404).json({ message: 'Fornecedor não encontrado.' });

      // Verifica se cpfCnpj já existe em outro registro
      const existente = await Fornecedor.findOne({ where: { cpfCnpj, id: { $ne: id } } });
      if (existente) return res.status(400).json({ message: 'CPF/CNPJ já cadastrado em outro fornecedor.' });

      await fornecedor.update({ nome, cpfCnpj, endereco, whatsapp, email });
      res.json(fornecedor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao atualizar fornecedor.' });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const fornecedor = await Fornecedor.findByPk(id);
      if (!fornecedor) return res.status(404).json({ message: 'Fornecedor não encontrado.' });

      await fornecedor.destroy();
      res.json({ message: 'Fornecedor excluído com sucesso.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao excluir fornecedor.' });
    }
  },
};
