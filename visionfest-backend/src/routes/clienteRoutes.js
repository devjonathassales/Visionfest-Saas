const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const clienteController = require("../controllers/clienteController");

// Agora sem prefixo /clientes aqui (já é montado em /api/clientes no app.js)
router.get("/", authCliente, clienteController.listar);
router.get("/:id", authCliente, clienteController.buscarPorId);
router.post("/", authCliente, clienteController.criar);
router.put("/:id", authCliente, clienteController.atualizar);
router.delete("/:id", authCliente, clienteController.deletar);

module.exports = router;
