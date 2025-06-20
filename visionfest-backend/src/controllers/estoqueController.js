const { Produto, EstoqueMovimentacao } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  // Lista produtos com estoque atual e provisionado no período
  async listarEstoque(req, res) {
    try {
      const { inicio, fim } = req.query;

      if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Informe o período inicial e final.' });
      }

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
        const entradas = movimentacoes
          .filter((m) => m.produtoId === produto.id && m.tipo === 'entrada')
          .reduce((acc, m) => acc + m.quantidade, 0);

        const saidas = movimentacoes
          .filter((m) => m.produtoId === produto.id && m.tipo === 'saida')
          .reduce((acc, m) => acc + m.quantidade, 0);

        return {
          id: produto.id,
          nome: produto.nome,
          estoque: entradas - saidas,
          estoqueMinimo: produto.estoqueMinimo,
          provisionado: saidas, // pode ser ajustado se quiser separar provisão futura
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

      if (!produtoId || !tipo || !quantidade) {
        return res.status(400).json({ erro: 'Dados incompletos.' });
      }

      const produto = await Produto.findByPk(produtoId);
      if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

      const novaMovimentacao = await EstoqueMovimentacao.create({
        produtoId,
        tipo,
        quantidade,
        data: new Date(), // se o campo `data` existir no modelo
      });

      res.status(201).json(novaMovimentacao);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao registrar movimentação' });
    }
  },
};
