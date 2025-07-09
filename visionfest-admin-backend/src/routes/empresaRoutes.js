const express = require("express");
const router = express.Router();
const empresaController = require("../controllers/empresaController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/", verificarToken, empresaController.criarEmpresa);
router.get("/", verificarToken, empresaController.listarEmpresas);
router.patch("/:id/bloquear", verificarToken, empresaController.bloquearEmpresa);

module.exports = router;
