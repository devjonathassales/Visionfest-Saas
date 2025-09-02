const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const fornecedorController = require("../controllers/fornecedorController");

// base já montada em app.js: app.use("/api/fornecedores", router)
router.get("/", authCliente, fornecedorController.listar);
router.get("/:id", authCliente, fornecedorController.buscarPorId);
router.post("/", authCliente, fornecedorController.criar);
router.put("/:id", authCliente, fornecedorController.atualizar);
router.delete("/:id", authCliente, fornecedorController.deletar);

module.exports = router;
