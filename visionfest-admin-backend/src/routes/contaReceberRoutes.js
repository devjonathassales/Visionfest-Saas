const express = require("express");
const router = express.Router();
const controller = require("../controllers/contaReceberController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

// Formas de pagamento (público para dropdowns)
router.get("/formas-pagamento", controller.getFormasPagamento);

// Listar e detalhar contas
router.get("/", verificarPermissao("acessarFinanceiro"), controller.listar);
router.get("/:id", verificarPermissao("acessarFinanceiro"), controller.obterPorId);

// Criar e atualizar contas
router.post("/", verificarPermissao("acessarFinanceiro"), controller.criar);
router.patch("/:id", verificarPermissao("acessarFinanceiro"), controller.atualizar);

// Receber e estornar pagamento
router.patch("/:id/receber", verificarPermissao("acessarFinanceiro"), controller.receber);
router.patch("/:id/estornar", verificarPermissao("acessarFinanceiro"), controller.estornar);

// Excluir conta
router.delete("/:id", verificarPermissao("acessarFinanceiro"), controller.excluir);

module.exports = router;
