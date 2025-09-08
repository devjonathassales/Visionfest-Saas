// src/controllers/faturasController.js
const { Op } = require("sequelize");
const { getDbCliente } = require("../utils/tenant");

module.exports = {
  // GET /api/faturas
  listar: async (req, res) => {
    try {
      const db = await getDbCliente(req);
      const ContaPagar = db.models?.ContaPagar;
      if (!ContaPagar) return res.json([]);

      const list = await ContaPagar.findAll({
        order: [["vencimento", "ASC"]],
      });

      res.json(list);
    } catch (e) {
      console.error("[faturasController.listar]", e);
      res.status(500).json({ mensagem: "Erro ao listar faturas." });
    }
  },

  // GET /api/faturas/:id
  obter: async (req, res) => {
    try {
      const db = await getDbCliente(req);
      const ContaPagar = db.models?.ContaPagar;
      if (!ContaPagar)
        return res.status(404).json({ mensagem: "Não encontrado." });

      const item = await ContaPagar.findByPk(req.params.id);
      if (!item) return res.status(404).json({ mensagem: "Não encontrado." });

      res.json(item);
    } catch (e) {
      console.error("[faturasController.obter]", e);
      res.status(500).json({ mensagem: "Erro ao carregar fatura." });
    }
  },

  // POST /api/faturas/:id/pagar  (placeholder)
  pagar: async (req, res) => {
    try {
      const db = await getDbCliente(req);
      const ContaPagar = db.models?.ContaPagar;
      if (!ContaPagar)
        return res.status(404).json({ mensagem: "Não encontrado." });

      const item = await ContaPagar.findByPk(req.params.id);
      if (!item) return res.status(404).json({ mensagem: "Não encontrado." });

      // exemplo simples: marca como pago (ajuste ao seu schema real)
      if (ContaPagar.rawAttributes?.status) item.status = "pago";
      if (ContaPagar.rawAttributes?.dataPagamento)
        item.dataPagamento = new Date();
      await item.save();

      res.json({ ok: true, fatura: item });
    } catch (e) {
      console.error("[faturasController.pagar]", e);
      res.status(500).json({ mensagem: "Erro ao pagar fatura." });
    }
  },
};
