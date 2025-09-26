// src/routes/diagRoutes.js
const express = require("express");
const router = express.Router();
const { getDbCliente } = require("../utils/tenant");

router.get("/faturas", async (req, res) => {
  try {
    const tenantHeader = req.headers["x-tenant"] || null;
    const db = await getDbCliente(req);
    const FaturaSaaS = db.models?.FaturaSaaS || db.FaturaSaaS;

    let count = null;
    let sample = null;
    let modelsLoaded = [];

    if (db && db.sequelize) {
      modelsLoaded = Object.keys(db.models || db.sequelize.models || {});
    }

    if (FaturaSaaS) {
      count = await FaturaSaaS.count();
      sample = await FaturaSaaS.findOne({ order: [["id", "DESC"]] });
    }

    res.json({
      ok: true,
      tenantHeader,
      modelsLoaded,
      hasFaturaSaaSModel: !!FaturaSaaS,
      count,
      sample,
    });
  } catch (e) {
    console.error("[/api/diag/faturas] ERRO:", e);
    res.status(500).json({ ok: false, erro: e.message });
  }
});

module.exports = router;
