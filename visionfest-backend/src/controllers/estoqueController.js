const Produto = require('../models/Produto');
const EstoqueMovimentacao = require('../models/EstoqueMovimentacao');
const { Op } = require('sequelize');

module.exports = {
  // Lista produtos com estoque atual e provisionado no período
  async listarEstoque(req, res) {
    try {
      const { inicio, fim } = req.query;

      const produtos = await Produto.findAll({
        order: [['nome', 'ASC']],
      });

      const movimentacoes = await EstoqueMovimentacao.findAll({
        where: {
          data: {
            [Op.between]: [inicio, fim],
          },
        },
      });

      const estoque = produtos.map((produto) => {
        const entradas = movimentacoes.filter(
          (m) => m.produtoId === produto.id && m.tipo === 'entrada'
        ).reduce((acc, m) => acc + m.quantidade, 0);

        const saidas = movimentacoes.filter(
          (m) => m.produtoId === produto.id && m.tipo === 'saida'
        ).reduce((acc, m) => acc + m.quantidade, 0);

        const provisionado = saidas; // Ex: contratos futuros
        const estoqueAtual = entradas - saidas;

        return {
          id: produto.id,
          nome: produto.nome,
          estoque: estoqueAtual,
          estoqueMinimo: produto.estoqueMinimo,
          provisionado,
        };
      });

      res.json(estoque);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar estoque' });
    }
  },

  // Registra uma nova movimentação
  async registrarMovimentacao(req, res) {
    try {
      const { produtoId, tipo, quantidade } = req.body;

      const produto = await Produto.findByPk(produtoId);
      if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

      const novaMovimentacao = await EstoqueMovimentacao.create({
        produtoId,
        tipo,
        quantidade,
      });

      res.status(201).json(novaMovimentacao);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao registrar movimentação' });
    }
  },
};
