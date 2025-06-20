const CartaoCredito = require('../models/CartaoCredito');

module.exports = {
  async listar(req, res) {
    try {
      const cartoes = await CartaoCredito.findAll();
      res.json(cartoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cartões' });
    }
  },

  async criar(req, res) {
    try {
      const { banco, taxaVista, taxaParcelado, taxaDebito } = req.body;
      if (!banco) return res.status(400).json({ error: 'Banco é obrigatório' });

      const novo = await CartaoCredito.create({
        banco,
        taxaVista,
        taxaParcelado,
        taxaDebito,
      });
      res.status(201).json(novo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar cartão' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { banco, taxaVista, taxaParcelado, taxaDebito } = req.body;
      const cartao = await CartaoCredito.findByPk(id);

      if (!cartao) return res.status(404).json({ error: 'Cartão não encontrado' });

      await cartao.update({ banco, taxaVista, taxaParcelado, taxaDebito });
      res.json(cartao);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar cartão' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const cartao = await CartaoCredito.findByPk(id);

      if (!cartao) return res.status(404).json({ error: 'Cartão não encontrado' });

      await cartao.destroy();
      res.json({ mensagem: 'Cartão excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir cartão' });
    }
  },
};
