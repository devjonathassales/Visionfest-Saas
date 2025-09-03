// src/routes/suporteAdminRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");
const suporteAdminController = require("../controllers/suporteAdminController");

// Protege todas as rotas
router.use(authMiddleware);

// Lista + busca detalhes
router.get(
  "/chamados",
  verificarPermissao("visualizarSuporte"),
  suporteAdminController.listarChamados
);
router.get(
  "/chamados/:id",
  verificarPermissao("visualizarSuporte"),
  suporteAdminController.buscarChamado
);

// Atualiza status do chamado
router.patch(
  "/chamados/:id/status",
  verificarPermissao("editarSuporte"),
  suporteAdminController.atualizarStatus
);

module.exports = router;
