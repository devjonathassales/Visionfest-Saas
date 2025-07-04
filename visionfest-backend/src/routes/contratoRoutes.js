const express = require("express");
const router = express.Router();
const contratoController = require("../controllers/contratoController");

// Listagem geral
router.get("/", contratoController.listar);

// Buscar por ID (deve vir antes de outras rotas com parâmetros)
router.get("/:id", contratoController.buscarPorId);

// Criar novo contrato
router.post("/", contratoController.criar);

// Atualizar contrato
router.put("/:id", contratoController.atualizar);

// Excluir contrato (e dependências em cascata)
router.delete("/:id", contratoController.excluir);

module.exports = router;
