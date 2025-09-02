const express = require("express");
const router = express.Router();
const contaBancariaController = require("../controllers/contaBancariaController");

// Montado em /api/contas-bancarias no app.js
router.get("/", contaBancariaController.listar);
router.get("/:id", contaBancariaController.obterPorId);
router.post("/", contaBancariaController.criar);
router.put("/:id", contaBancariaController.atualizar);
router.delete("/:id", contaBancariaController.excluir);

module.exports = router;
