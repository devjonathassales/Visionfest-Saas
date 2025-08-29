const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// CONTAS RECEBER
const contaReceberController = require("../controllers/contaReceberController");
router.get("/contas-receber/formas-pagamento", authEmpresa, contaReceberController.getFormasPagamento);
router.get("/contas-receber", authEmpresa, contaReceberController.listar);
router.get("/contas-receber/:id", authEmpresa, contaReceberController.obterPorId);
router.post("/contas-receber", authEmpresa, contaReceberController.criar);
router.put("/contas-receber/:id", authEmpresa, contaReceberController.atualizar);
router.put("/contas-receber/:id/receber", authEmpresa, contaReceberController.receber);
router.put("/contas-receber/:id/estorno", authEmpresa, contaReceberController.estornar);
router.delete("/contas-receber/:id", authEmpresa, contaReceberController.excluir);

module.exports = router;
