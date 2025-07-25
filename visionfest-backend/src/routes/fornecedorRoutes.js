const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// FORNECEDORES
const fornecedorController = require("../controllers/fornecedorController");
router.get("/fornecedores", authEmpresa, fornecedorController.listar);
router.get("/fornecedores/:id", authEmpresa, fornecedorController.buscarPorId);
router.post("/fornecedores", authEmpresa, fornecedorController.criar);
router.put("/fornecedores/:id", authEmpresa, fornecedorController.atualizar);
router.delete("/fornecedores/:id", authEmpresa, fornecedorController.deletar);

module.exports = router;
