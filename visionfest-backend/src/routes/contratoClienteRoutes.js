const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const contratoClienteController = require("../controllers/contratoClienteController");

// app.js: app.use("/api/contrato", contratoClienteRoutes)
router.get("/", authCliente, contratoClienteController.obterAtual);
router.get("/historico", authCliente, contratoClienteController.historico);
router.get("/planos", authCliente, contratoClienteController.planosDisponiveis);

router.patch(
  "/renovacao",
  authCliente,
  contratoClienteController.atualizarRenovacao
); // {renovacaoAutomatica:boolean}
router.post("/renovar", authCliente, contratoClienteController.renovarAgora); // estende validade +12m (placeholder)
router.post(
  "/upgrade",
  authCliente,
  contratoClienteController.solicitarUpgrade
); // {planoId}
router.post(
  "/cancelar",
  authCliente,
  contratoClienteController.solicitarCancelamento
); // {motivo}

module.exports = router;
