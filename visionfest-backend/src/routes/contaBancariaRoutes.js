const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// CONTAS BANCÁRIAS
const contaBancariaController = require("../controllers/contaBancariaController");
router.get("/contas-bancarias", authEmpresa, contaBancariaController.listar);
router.post("/contas-bancarias", authEmpresa, contaBancariaController.criar);
router.put("/contas-bancarias/:id", authEmpresa, contaBancariaController.atualizar);
router.delete("/contas-bancarias/:id", authEmpresa, contaBancariaController.excluir);


module.exports = router;
