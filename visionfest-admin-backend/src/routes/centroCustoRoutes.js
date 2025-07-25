const express = require("express");
const router = express.Router();
const centroCustoController = require("../controllers/centroCustoController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

router.get("/", verificarPermissao("visualizarCentrosCusto"), centroCustoController.listar);
router.post("/", verificarPermissao("editarCentrosCusto"), centroCustoController.criar);
router.put("/:id", verificarPermissao("editarCentrosCusto"), centroCustoController.atualizar);
router.delete("/:id", verificarPermissao("excluirCentrosCusto"), centroCustoController.excluir);

module.exports = router;
