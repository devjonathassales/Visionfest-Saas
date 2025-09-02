const express = require("express");
const router = express.Router();
const cartoesCreditoController = require("../controllers/cartoesCreditoController");

// Montado em /api/cartoes-credito no app.js
router.get("/", cartoesCreditoController.listar);
router.get("/:id", cartoesCreditoController.obterPorId);
router.post("/", cartoesCreditoController.criar);
router.put("/:id", cartoesCreditoController.atualizar);
router.delete("/:id", cartoesCreditoController.excluir);

module.exports = router;
