// src/routes/funcionarioRoutes.js
const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const funcionarioController = require("../controllers/funcionarioController");

// Este router é montado em /api/funcionarios no app.js
router.get("/", authCliente, funcionarioController.listar);
router.get("/:id", authCliente, funcionarioController.buscarPorId);
router.post("/", authCliente, funcionarioController.criar);
router.put("/:id", authCliente, funcionarioController.atualizar);
router.delete("/:id", authCliente, funcionarioController.excluir);

module.exports = router;
