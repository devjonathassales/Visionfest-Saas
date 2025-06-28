const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.post("/", usuarioController.criar);
router.get("/", usuarioController.listar);
router.put("/:id", usuarioController.atualizar);        // detalhe abaixo
router.patch("/:id/ativo", usuarioController.toggleAtivo);
router.delete("/:id", usuarioController.deletar);

module.exports = router;
