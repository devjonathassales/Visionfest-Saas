const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// ESTOQUE
const estoqueController = require("../controllers/estoqueController");
router.get("/estoque", authEmpresa, estoqueController.listarEstoque);
router.post("/estoque/movimentar", authEmpresa, estoqueController.registrarMovimentacao);

module.exports = router;
