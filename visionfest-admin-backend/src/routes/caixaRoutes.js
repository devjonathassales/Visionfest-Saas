const express = require("express");
const router = express.Router();
const caixaController = require("../controllers/caixaController");

router.post("/abrir", caixaController.abrirCaixa);
router.post("/fechar", caixaController.fecharCaixa);
router.get("/atual", caixaController.getCaixaAtual);

router.post("/entrada-manual", caixaController.addEntradaManual);
router.post("/saida-manual", caixaController.addSaidaManual);

router.get("/entradas", caixaController.listarEntradas);
router.get("/saidas", caixaController.listarSaidas);

module.exports = router;
