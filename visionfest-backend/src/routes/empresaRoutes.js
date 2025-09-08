// src/routes/empresaRoutes.js
const express = require("express");
const router = express.Router();
const empresaController = require("../controllers/empresaController");

// BASE DO ROUTER: /api/empresa

// --- Rotas corretas na raiz ---
router.get("/", empresaController.getEmpresa);
router.put(
  "/",
  /* upload.single('logo'), */ empresaController.atualizarEmpresa
);
router.post("/importar-admin", empresaController.importarDoAdmin);
router.post("/enderecos", empresaController.criarEndereco);
router.put("/enderecos/:id", empresaController.atualizarEndereco);
router.delete("/enderecos/:id", empresaController.excluirEndereco);



module.exports = router;
