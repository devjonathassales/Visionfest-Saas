const express = require("express");
const router = express.Router();
const contratoController = require("../controllers/contratoController");

// Listar contratos (com filtro por cliente e datas)
router.get("/", contratoController.listar);

// Criar novo contrato
router.post("/", contratoController.criar);

// Atualizar contrato
router.put("/:id", contratoController.atualizar);

// Excluir contrato
router.delete("/:id", contratoController.excluir);

// Buscar contrato por id
router.get("/:id", contratoController.buscarPorId);

module.exports = router;
