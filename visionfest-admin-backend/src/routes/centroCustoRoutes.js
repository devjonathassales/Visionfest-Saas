const express = require("express");
const router = express.Router();
const centroCustoController = require("../controllers/centroCustoController");

// GET /centros-custo
router.get("/", centroCustoController.listar);

// POST /centros-custo
router.post("/", centroCustoController.criar);

// PUT /centros-custo/:id
router.put("/:id", centroCustoController.atualizar);

// DELETE /centros-custo/:id
router.delete("/:id", centroCustoController.excluir);

module.exports = router;
