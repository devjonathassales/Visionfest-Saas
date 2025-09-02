// src/routes/contasReceberRoutes.js
const express = require("express");
const router = express.Router();
const contaReceberController = require("../controllers/contaReceberController");

// authCliente + multiTenant já são aplicados no app.js
router.get("/formas-pagamento", contaReceberController.getFormasPagamento);
router.get("/", contaReceberController.listar);
router.get("/:id", contaReceberController.obterPorId);
router.post("/", contaReceberController.criar);
router.put("/:id", contaReceberController.atualizar);
router.put("/:id/receber", contaReceberController.receber);
router.put("/:id/estorno", contaReceberController.estornar);
router.delete("/:id", contaReceberController.excluir);

module.exports = router;
