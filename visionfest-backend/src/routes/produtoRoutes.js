// src/routes/produtoRoutes.js
const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const produtoController = require("../controllers/produtoController");

// Montado em /api/produtos no app.js
router.get("/", authCliente, produtoController.listar);
router.get("/:id", authCliente, produtoController.buscarPorId);
router.post("/", authCliente, produtoController.criar);
router.put("/:id", authCliente, produtoController.atualizar);
router.delete("/:id", authCliente, produtoController.excluir);

module.exports = router;
