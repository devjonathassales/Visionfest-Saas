const express = require("express");
const router = express.Router();
const caixaController = require("../controllers/caixaController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

router.post("/abrir", verificarPermissao("acessarFinanceiro"), caixaController.abrirCaixa);
router.post("/fechar", verificarPermissao("acessarFinanceiro"), caixaController.fecharCaixa);
router.get("/atual", verificarPermissao("acessarFinanceiro"), caixaController.getCaixaAtual);

router.post("/entrada-manual", verificarPermissao("acessarFinanceiro"), caixaController.addEntradaManual);
router.post("/saida-manual", verificarPermissao("acessarFinanceiro"), caixaController.addSaidaManual);

router.get("/entradas", verificarPermissao("acessarFinanceiro"), caixaController.listarEntradas);
router.get("/saidas", verificarPermissao("acessarFinanceiro"), caixaController.listarSaidas);

module.exports = router;
