const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/faturasController");

// Essas rotas já estão atrás de multiTenantMiddleware + authCliente no app.js
router.get("/", ctrl.listar);
router.get("/:id", ctrl.obter);

module.exports = router;
