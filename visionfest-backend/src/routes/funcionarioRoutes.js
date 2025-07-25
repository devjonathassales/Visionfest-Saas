const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// FUNCIONÁRIOS
const funcionarioController = require("../controllers/funcionarioController");
router.get("/funcionarios", authEmpresa, funcionarioController.listar);
router.get("/funcionarios/:id", authEmpresa, funcionarioController.buscarPorId);
router.post("/funcionarios", authEmpresa, funcionarioController.criar);
router.put("/funcionarios/:id", authEmpresa, funcionarioController.atualizar);
router.delete("/funcionarios/:id", authEmpresa, funcionarioController.excluir);

module.exports = router;
