const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const centroCustoController = require("../controllers/centroCustoController");

router.get("/", authCliente, centroCustoController.listar);
router.post("/", authCliente, centroCustoController.criar);
router.put("/:id", authCliente, centroCustoController.atualizar);
router.delete("/:id", authCliente, centroCustoController.excluir);

module.exports = router;
