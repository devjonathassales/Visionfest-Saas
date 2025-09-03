const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const faturaController = require("../controllers/faturaController");

// app.js: app.use("/api/faturas", faturaRoutes)
router.get("/", authCliente, faturaController.listar);
router.post("/:id/pagar", authCliente, faturaController.iniciarPagamento); // placeholder

module.exports = router;
