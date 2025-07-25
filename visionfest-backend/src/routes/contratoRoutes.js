const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// CONTRATOS
const contratoController = require("../controllers/contratoController");
router.get("/contratos", authEmpresa, contratoController.listar);
router.get("/contratos/agenda", authEmpresa, contratoController.listarAgenda);
router.get("/contratos/:id", authEmpresa, contratoController.buscarPorId);
router.post("/contratos", authEmpresa, contratoController.criar);
router.put("/contratos/:id", authEmpresa, contratoController.atualizar);
router.delete("/contratos/:id", authEmpresa, contratoController.excluir);

module.exports = router;
