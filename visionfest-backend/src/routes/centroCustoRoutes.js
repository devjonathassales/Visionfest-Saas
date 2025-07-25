const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// CENTRO CUSTO
const centroCustoController = require("../controllers/centroCustoController");
router.get("/centro-custo", authEmpresa, centroCustoController.listar);
router.post("/centro-custo", authEmpresa, centroCustoController.criar);
router.put("/centro-custo/:id", authEmpresa, centroCustoController.atualizar);
router.delete("/centro-custo/:id", authEmpresa, centroCustoController.excluir);



module.exports = router;
