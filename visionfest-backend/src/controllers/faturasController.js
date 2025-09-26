const { getDbCliente } = require("../utils/tenant");

module.exports = {
  // GET /api/faturas
  listar: async (req, res) => {
    try {
      const db = await getDbCliente(req);
      const FaturaSaaS = db.models?.FaturaSaaS || db.FaturaSaaS;
      if (!FaturaSaaS) return res.json([]);

      const where = {};
      // aplica escopo por empresa quando suportado pelo model
      if (FaturaSaaS.rawAttributes?.empresaId && req.empresaId) {
        where.empresaId = req.empresaId;
      }

      const list = await FaturaSaaS.findAll({
        where,
        order: [
          ["vencimento", "ASC"],
          ["id", "ASC"],
        ],
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
      const FaturaSaaS = db.models?.FaturaSaaS || db.FaturaSaaS;
      if (!FaturaSaaS)
        return res.status(404).json({ mensagem: "Não encontrado." });

      const where = { id: Number(req.params.id) };
      if (FaturaSaaS.rawAttributes?.empresaId && req.empresaId) {
        where.empresaId = req.empresaId;
      }

      const item = await FaturaSaaS.findOne({ where });
      if (!item) return res.status(404).json({ mensagem: "Não encontrado." });

      res.json(item);
    } catch (e) {
      console.error("[faturasController.obter]", e);
      res.status(500).json({ mensagem: "Erro ao carregar fatura." });
    }
  },
};
