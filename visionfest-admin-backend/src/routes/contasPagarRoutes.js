const express = require("express");
const router = express.Router();
const controller = require("../controllers/contaPagarController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

router.get("/", verificarPermissao("acessarFinanceiro"), controller.listar);
router.get("/:id", verificarPermissao("acessarFinanceiro"), controller.obterPorId);
router.post("/", verificarPermissao("acessarFinanceiro"), controller.criar);
router.put("/:id", verificarPermissao("acessarFinanceiro"), controller.atualizar);
router.put("/:id/baixa", verificarPermissao("acessarFinanceiro"), controller.baixar);
router.put("/:id/estorno", verificarPermissao("acessarFinanceiro"), controller.estornar);
router.delete("/:id", verificarPermissao("acessarFinanceiro"), controller.excluir);

module.exports = router;
