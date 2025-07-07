const express = require("express");
const router = express.Router();
const contratoController = require("../controllers/contratoController");

// Listagem geral
router.get("/", contratoController.listar);

// Listagem para agenda
router.get("/agenda", contratoController.listarAgenda);

// Buscar por ID
router.get("/:id", contratoController.buscarPorId);

// Criar contrato
router.post("/", contratoController.criar);

// Atualizar contrato
router.put("/:id", contratoController.atualizar);

// Excluir contrato
router.delete("/:id", contratoController.excluir);

module.exports = router;
