// src/routes/clienteAuthRoutes.js
const express = require("express");
const router = express.Router();

const authClienteController = require("../controllers/authClienteController");
const authCliente = require("../middlewares/authCliente");

// Públicas
router.post("/login", authClienteController.login);
router.post("/refresh", authClienteController.refresh);

// Protegidas
router.get("/me", authCliente, authClienteController.me);
router.post("/logout", authCliente, authClienteController.logout);

module.exports = router;
