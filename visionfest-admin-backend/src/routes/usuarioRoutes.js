const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

router.get("/", verificarPermissao("configurarSistema"), usuarioController.listarUsuarios);
router.post("/", verificarPermissao("configurarSistema"), usuarioController.criarUsuario);
router.put("/:id", verificarPermissao("configurarSistema"), usuarioController.atualizarUsuario);
router.delete("/:id", verificarPermissao("configurarSistema"), usuarioController.excluirUsuario);
router.patch("/:id/inativar", verificarPermissao("configurarSistema"), usuarioController.inativarUsuario);

module.exports = router;
