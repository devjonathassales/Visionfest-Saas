const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// EMPRESAS
const empresaController = require("../controllers/empresaController");
router.get("/empresas/todas", authEmpresa, empresaController.listarTodas);
router.get("/empresas/:id", authEmpresa, empresaController.buscar);
router.post("/empresas", authEmpresa, empresaController.criarOuAtualizar);
router.put("/empresas/:id", authEmpresa, empresaController.criarOuAtualizar);
router.delete("/empresas/:id", authEmpresa, empresaController.deletar);

module.exports = router;
