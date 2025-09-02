// src/routes/usuarioRoutes.js
const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const usuarioController = require("../controllers/usuarioController");

// O app monta: app.use("/api/usuarios", usuarioRoutes)
router.post("/", authCliente, usuarioController.criar);
router.get("/", authCliente, usuarioController.listar);
router.put("/:id", authCliente, usuarioController.atualizar);
router.patch("/:id/ativo", authCliente, usuarioController.toggleAtivo);
router.delete("/:id", authCliente, usuarioController.deletar);

module.exports = router;
