const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// USUÁRIOS
const usuarioController = require("../controllers/usuarioController");
router.post("/usuarios", authEmpresa, usuarioController.criar);
router.get("/usuarios", authEmpresa, usuarioController.listar);
router.put("/usuarios/:id", authEmpresa, usuarioController.atualizar);
router.patch("/usuarios/:id/ativo", authEmpresa, usuarioController.toggleAtivo);
router.delete("/usuarios/:id", authEmpresa, usuarioController.deletar);

module.exports = router;
