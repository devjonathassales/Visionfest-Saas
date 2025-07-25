const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// PRODUTOS
const produtoController = require("../controllers/produtoController");
router.get("/produtos", authEmpresa, produtoController.listar);
router.get("/produtos/:id", authEmpresa, produtoController.buscarPorId);
router.post("/produtos", authEmpresa, produtoController.criar);
router.put("/produtos/:id", authEmpresa, produtoController.atualizar);
router.delete("/produtos/:id", authEmpresa, produtoController.excluir);

module.exports = router;
