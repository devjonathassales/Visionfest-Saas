const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// PERMISSÕES
const permissaoController = require("../controllers/permissaoController");
router.get("/permissoes/:id", authEmpresa, permissaoController.buscarPermissoes);
router.put("/permissoes/:id", authEmpresa, permissaoController.salvarPermissoes);

module.exports = router;
