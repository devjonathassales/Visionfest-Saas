const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const uploadSuporte = require("../middlewares/uploadSuporte");
const suporteClienteController = require("../controllers/suporteClienteController");

// app.js: app.use("/api/suporte", suporteClienteRoutes)
router.get("/chamados", authCliente, suporteClienteController.meusChamados);
router.post(
  "/chamados",
  authCliente,
  uploadSuporte.array("anexos", 5),
  suporteClienteController.abrirChamado
);

module.exports = router;
