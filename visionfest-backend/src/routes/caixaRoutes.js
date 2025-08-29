const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// CAIXA
const caixaController = require("../controllers/caixaController");
router.post("/caixa/abrir", authEmpresa, caixaController.abrirCaixa);
router.post("/caixa/fechar", authEmpresa, caixaController.fecharCaixa);
router.get("/caixa/atual", authEmpresa, caixaController.getCaixaAtual);
router.post("/caixa/entrada-manual", authEmpresa, caixaController.addEntradaManual);
router.post("/caixa/saida-manual", authEmpresa, caixaController.addSaidaManual);
router.get("/caixa/entradas", authEmpresa, caixaController.listarEntradas);
router.get("/caixa/saidas", authEmpresa, caixaController.listarSaidas);

module.exports = router;
