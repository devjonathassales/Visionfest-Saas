const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const estoqueController = require("../controllers/estoqueController");

// Montado em /api/estoque no app.js
router.get("/", authCliente, estoqueController.listarEstoque);
router.post(
  "/movimentar",
  authCliente,
  estoqueController.registrarMovimentacao
);

module.exports = router;
