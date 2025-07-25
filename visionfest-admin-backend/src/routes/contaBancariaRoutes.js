const express = require("express");
const router = express.Router();
const contaBancariaController = require("../controllers/contaBancariaController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

router.get("/", verificarPermissao("visualizarContasBancarias"), contaBancariaController.listar);
router.post("/", verificarPermissao("editarContasBancarias"), contaBancariaController.criar);
router.put("/:id", verificarPermissao("editarContasBancarias"), contaBancariaController.atualizar);
router.delete("/:id", verificarPermissao("excluirContasBancarias"), contaBancariaController.excluir);

module.exports = router;
