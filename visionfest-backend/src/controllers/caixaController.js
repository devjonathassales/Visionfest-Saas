const { getDbCliente } = require("../utils/tenant");

module.exports = {
  async abrirCaixa(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Caixa } = db.models;

      // Fecha caixas abertos (se houver) desta empresa
      await Caixa.update(
        { aberto: false, dataFechamento: new Date() },
        { where: { aberto: true, empresaId: req.empresaId } }
      );

      const caixa = await Caixa.create({
        aberto: true,
        dataAbertura: new Date(),
        dataFechamento: null,
        empresaId: req.empresaId,
      });

      res.status(201).json(caixa);
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      res.status(500).json({ error: "Erro ao abrir caixa." });
    }
  },

  async fecharCaixa(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Caixa } = db.models;

      const caixaAberto = await Caixa.findOne({
        where: { aberto: true, empresaId: req.empresaId },
      });
      if (!caixaAberto) {
        return res.status(400).json({ error: "Nenhum caixa aberto encontrado." });
      }

      caixaAberto.aberto = false;
      caixaAberto.dataFechamento = new Date();
      await caixaAberto.save();

      res.json(caixaAberto);
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
      res.status(500).json({ error: "Erro ao fechar caixa." });
    }
  },

  async getCaixaAtual(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { Caixa } = db.models;

      const caixaAberto = await Caixa.findOne({
        where: { aberto: true, empresaId: req.empresaId },
      });
      if (!caixaAberto) {
        return res.status(404).json({ error: "Nenhum caixa aberto." });
      }
      res.json(caixaAberto);
    } catch (error) {
      console.error("Erro ao obter caixa atual:", error);
      res.status(500).json({ error: "Erro ao obter caixa atual." });
    }
  },

  async addEntradaManual(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { EntradaManual } = db.models;

      const { descricao, valor, formaPagamento } = req.body;
      if (!descricao || !valor || !formaPagamento) {
        return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
      }

      const entrada = await EntradaManual.create({
        descricao,
        valor,
        formaPagamento,
        data: new Date(),
        empresaId: req.empresaId,
      });

      res.status(201).json(entrada);
    } catch (error) {
      console.error("Erro ao adicionar entrada manual:", error);
      res.status(500).json({ error: "Erro ao adicionar entrada manual." });
    }
  },

  async addSaidaManual(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { SaidaManual } = db.models;

      const { descricao, valor, formaPagamento } = req.body;
      if (!descricao || !valor || !formaPagamento) {
        return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
      }

      const saida = await SaidaManual.create({
        descricao,
        valor,
        formaPagamento,
        data: new Date(),
        empresaId: req.empresaId,
      });

      res.status(201).json(saida);
    } catch (error) {
      console.error("Erro ao adicionar saída manual:", error);
      res.status(500).json({ error: "Erro ao adicionar saída manual." });
    }
  },

  async listarEntradas(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { EntradaManual } = db.models;

      const entradas = await EntradaManual.findAll({
        where: { empresaId: req.empresaId },
        order: [["data", "DESC"]],
      });
      res.json(entradas);
    } catch (error) {
      console.error("Erro ao listar entradas manuais:", error);
      res.status(500).json({ error: "Erro ao listar entradas manuais." });
    }
  },

  async listarSaidas(req, res) {
    try {
      const db = getDbCliente(req.bancoCliente);
      const { SaidaManual } = db.models;

      const saidas = await SaidaManual.findAll({
        where: { empresaId: req.empresaId },
        order: [["data", "DESC"]],
      });
      res.json(saidas);
    } catch (error) {
      console.error("Erro ao listar saídas manuais:", error);
      res.status(500).json({ error: "Erro ao listar saídas manuais." });
    }
  },
};
