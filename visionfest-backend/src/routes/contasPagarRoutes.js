const express = require("express");
const router = express.Router();
const contaPagarController = require("../controllers/contaPagarController");

// NADA de authCliente aqui; já vem do app.js (multiTenantMiddleware, authCliente)
router.get("/", contaPagarController.listar);
router.get("/:id", contaPagarController.obterPorId);
router.post("/", contaPagarController.criar);
router.put("/:id", contaPagarController.atualizar);
router.put("/:id/baixa", contaPagarController.baixar);
router.put("/:id/estorno", contaPagarController.estornar);
router.delete("/:id", contaPagarController.excluir);

module.exports = router;
