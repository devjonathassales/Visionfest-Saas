// src/routes/empresaRoutes.js
const express = require("express");
const router = express.Router();
const empresaController = require("../controllers/empresaController");

// Base do router: /api/empresa
// OBS: multi-tenant + auth já devem estar aplicados no app.js antes deste router.

// ---------------------------
// Empresa (dados gerais)
// ---------------------------

// GET dados da empresa (tenant)
router.get("/", empresaController.getMinhaEmpresa);
// Alias opcional (se seu front/outras partes já usarem /minha)
router.get("/minha", empresaController.getMinhaEmpresa);

// Atualiza dados da empresa
// Se for enviar logo (arquivo), descomente o upload.single('logo') aqui
router.put(
  "/",
  /* upload.single('logo'), */ empresaController.atualizarMinhaEmpresa
);

// Importa/espelha dados do ADMIN para o tenant (idempotente)
router.post("/importar-admin", empresaController.importarDoAdmin);

// Botão “Sincronizar Financeiro” (placeholder/gancho)
router.post("/importar-financeiro", empresaController.syncFinanceiro);

// ---------------------------
// Endereços da empresa
// ---------------------------

router.post("/enderecos", empresaController.criarEndereco);
router.put("/enderecos/:id", empresaController.atualizarEndereco);
router.delete("/enderecos/:id", empresaController.excluirEndereco);

module.exports = router;
