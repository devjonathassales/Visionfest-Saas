const express = require("express");
const router = express.Router();
const { listarPermissoes } = require("../controllers/permissaoController");
const authMiddleware = require("../middlewares/authMiddleware");

// Apenas usuários logados podem ver as permissões
router.get("/", authMiddleware, listarPermissoes);

module.exports = router;
