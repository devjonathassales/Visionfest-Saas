const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");

// Listar todos os clientes, opcional filtro busca
router.get("/", clienteController.listar);

// Buscar cliente por ID
router.get("/:id", clienteController.buscarPorId);

// Criar novo cliente
router.post("/", clienteController.criar);

// Atualizar cliente
router.put("/:id", clienteController.atualizar);

// Deletar cliente
router.delete("/:id", clienteController.deletar);

module.exports = router;
