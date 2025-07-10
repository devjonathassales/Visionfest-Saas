const express = require("express");
const router = express.Router();
const controller = require("../controllers/contaReceberController");

// ROTAS FIXAS PRIMEIRO
router.get("/formas-pagamento", controller.getFormasPagamento);

// ROTAS CRUD
router.get("/", controller.listar);
router.get("/:id", controller.obterPorId);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.put("/:id/receber", controller.receber);
router.put("/:id/estorno", controller.estornar);
router.delete("/:id", controller.excluir);

module.exports = router;
