const { Caixa, EntradaManual, SaidaManual } = require("../models");

module.exports = {
  async abrirCaixa(req, res) {
    try {
      // Fecha caixas abertos (se houver)
      await Caixa.update(
        { aberto: false, dataFechamento: new Date() },
        { where: { aberto: true } }
      );

      const caixa = await Caixa.create({
        aberto: true,
        dataAbertura: new Date(),
        dataFechamento: null,
      });

      res.status(201).json(caixa);
    } catch (error) {
      res.status(500).json({ error: "Erro ao abrir caixa." });
    }
  },

  async fecharCaixa(req, res) {
    try {
      const caixaAberto = await Caixa.findOne({ where: { aberto: true } });
      if (!caixaAberto) {
        return res.status(400).json({ error: "Nenhum caixa aberto encontrado." });
      }

      caixaAberto.aberto = false;
      caixaAberto.dataFechamento = new Date();
      await caixaAberto.save();

      res.json(caixaAberto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao fechar caixa." });
    }
  },

  async getCaixaAtual(req, res) {
    try {
      const caixaAberto = await Caixa.findOne({ where: { aberto: true } });
      if (!caixaAberto) {
        return res.status(404).json({ error: "Nenhum caixa aberto." });
      }
      res.json(caixaAberto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao obter caixa atual." });
    }
  },

  async addEntradaManual(req, res) {
    try {
      const { descricao, valor, formaPagamento } = req.body;
      if (!descricao || !valor || !formaPagamento) {
        return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
      }

      const entrada = await EntradaManual.create({
        descricao,
        valor,
        formaPagamento,
        data: new Date(),
      });

      res.status(201).json(entrada);
    } catch (error) {
      res.status(500).json({ error: "Erro ao adicionar entrada manual." });
    }
  },

  async addSaidaManual(req, res) {
    try {
      const { descricao, valor, formaPagamento } = req.body;
      if (!descricao || !valor || !formaPagamento) {
        return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
      }

      const saida = await SaidaManual.create({
        descricao,
        valor,
        formaPagamento,
        data: new Date(),
      });

      res.status(201).json(saida);
    } catch (error) {
      res.status(500).json({ error: "Erro ao adicionar saída manual." });
    }
  },

  async listarEntradas(req, res) {
    try {
      const entradas = await EntradaManual.findAll({ order: [["data", "DESC"]] });
      res.json(entradas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar entradas manuais." });
    }
  },

  async listarSaidas(req, res) {
    try {
      const saidas = await SaidaManual.findAll({ order: [["data", "DESC"]] });
      res.json(saidas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar saídas manuais." });
    }
  },
};
