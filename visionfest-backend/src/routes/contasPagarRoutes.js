const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// CONTAS PAGAR
const contaPagarController = require("../controllers/contaPagarController");
router.get("/contas-pagar", authEmpresa, contaPagarController.listar);
router.get("/contas-pagar/:id", authEmpresa, contaPagarController.obterPorId);
router.post("/contas-pagar", authEmpresa, contaPagarController.criar);
router.put("/contas-pagar/:id", authEmpresa, contaPagarController.atualizar);
router.put("/contas-pagar/:id/baixa", authEmpresa, contaPagarController.baixar);
router.put("/contas-pagar/:id/estorno", authEmpresa, contaPagarController.estornar);
router.delete("/contas-pagar/:id", authEmpresa, contaPagarController.excluir);

module.exports = router;
