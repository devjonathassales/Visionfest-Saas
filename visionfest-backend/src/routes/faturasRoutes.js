const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { Fatura, Sequelize } = req.models || {};
    if (!Fatura) return res.json([]);

    const where = {};
    if (Fatura.rawAttributes?.empresaId) where.empresaId = req.empresaId;

    if (req.query.status && Fatura.rawAttributes?.status)
      where.status = req.query.status;
    if (req.query.search && Fatura.rawAttributes?.numero) {
      where.numero = { [Sequelize.Op.iLike]: `%${req.query.search}%` };
    }

    const rows = await Fatura.findAll({
      where,
      order: [
        ["dataEmissao", "DESC"],
        ["id", "DESC"],
      ],
    });
    res.json(rows);
  } catch (e) {
    console.error("[faturas] list:", e);
    res.status(500).json([]);
  }
});

module.exports = router;
