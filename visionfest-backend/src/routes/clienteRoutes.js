const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// CLIENTE CRUD
const clienteController = require("../controllers/clienteController");
router.get("/clientes", authEmpresa, clienteController.listar);
router.get("/clientes/:id", authEmpresa, clienteController.buscarPorId);
router.post("/clientes", authEmpresa, clienteController.criar);
router.put("/clientes/:id", authEmpresa, clienteController.atualizar);
router.delete("/clientes/:id", authEmpresa, clienteController.deletar);


module.exports = router;
