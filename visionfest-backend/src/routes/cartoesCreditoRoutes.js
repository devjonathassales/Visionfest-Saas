const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// CARTOES CREDITO
const cartoesCreditoController = require("../controllers/cartoesCreditoController");
router.get("/cartoes-credito", authEmpresa, cartoesCreditoController.listar);
router.post("/cartoes-credito", authEmpresa, cartoesCreditoController.criar);
router.put("/cartoes-credito/:id", authEmpresa, cartoesCreditoController.atualizar);
router.delete("/cartoes-credito/:id", authEmpresa, cartoesCreditoController.excluir);


module.exports = router;
