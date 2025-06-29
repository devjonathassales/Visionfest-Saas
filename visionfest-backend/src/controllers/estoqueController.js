const { Produto, EstoqueMovimentacao, ContratoProduto, sequelize } = require("../models");
const { Op } = require("sequelize");

module.exports = {
  async listarEstoque(req, res) {
    try {
      const { inicio, fim } = req.query;
      if (!inicio || !fim) {
        return res.status(400).json({ erro: "Informe o período inicial e final." });
      }

      // Busca todos os produtos
      const produtos = await Produto.findAll({ order: [["nome", "ASC"]] });

      // Soma de entradas e saídas por produto no período
      const movimentacoes = await EstoqueMovimentacao.findAll({
        where: {
          data: { [Op.between]: [inicio, fim] },
        },
        attributes: [
          "produtoId",
          "tipo",
          [sequelize.fn("SUM", sequelize.col("quantidade")), "total"],
        ],
        group: ["produtoId", "tipo"],
        raw: true,
      });

      // Soma do provisionamento no período
      const provisionamentos = await ContratoProduto.findAll({
        where: {
          dataEvento: { [Op.between]: [inicio, fim] },
        },
        attributes: [
          "produtoId",
          [sequelize.fn("SUM", sequelize.col("quantidade")), "total"],
        ],
        group: ["produtoId"],
        raw: true,
      });

      const entradaMap = {};
      const saidaMap = {};
      const provisionadoMap = {};

      movimentacoes.forEach((mov) => {
        if (mov.tipo === "entrada") {
          entradaMap[mov.produtoId] = parseInt(mov.total);
        } else if (mov.tipo === "saida") {
          saidaMap[mov.produtoId] = parseInt(mov.total);
        }
      });

      provisionamentos.forEach((prov) => {
        provisionadoMap[prov.produtoId] = parseInt(prov.total);
      });

      const estoque = produtos.map((produto) => {
        const entradas = entradaMap[produto.id] || 0;
        const saidas = saidaMap[produto.id] || 0;
        const provisionado = provisionadoMap[produto.id] || 0;

        const estoqueAtual = entradas - saidas;
        const estoqueDisponivel = estoqueAtual - provisionado;

        return {
          id: produto.id,
          nome: produto.nome,
          estoque: estoqueAtual,
          estoqueMinimo: produto.estoqueMinimo,
          provisionado,
          estoqueDisponivel,
        };
      });

      res.json(estoque);
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      res.status(500).json({ erro: "Erro ao buscar estoque" });
    }
  },

  async registrarMovimentacao(req, res) {
    try {
      const { produtoId, tipo, quantidade } = req.body;
      if (!produtoId || !tipo || !quantidade) {
        return res.status(400).json({ erro: "Dados incompletos." });
      }

      const produto = await Produto.findByPk(produtoId);
      if (!produto) return res.status(404).json({ erro: "Produto não encontrado." });

      const novaMovimentacao = await EstoqueMovimentacao.create({
        produtoId,
        tipo,
        quantidade,
        data: new Date(),
      });

      res.status(201).json(novaMovimentacao);
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      res.status(500).json({ erro: "Erro ao registrar movimentação" });
    }
  },
};
