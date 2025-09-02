const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const caixaController = require("../controllers/caixaController");

// O app.js deve montar assim: app.use("/api/caixa", caixaRoutes)

router.get("/entradas", authCliente, caixaController.listarEntradas);
router.get("/saidas", authCliente, caixaController.listarSaidas);
router.get("/atual", authCliente, caixaController.getCaixaAtual);

router.post("/abrir", authCliente, caixaController.abrirCaixa);
router.post("/fechar", authCliente, caixaController.fecharCaixa);

router.post("/entrada-manual", authCliente, caixaController.addEntradaManual);
router.post("/saida-manual", authCliente, caixaController.addSaidaManual);

module.exports = router;
