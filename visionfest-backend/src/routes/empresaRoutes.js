// src/routes/empresaRoutes.js
const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const empresaController = require("../controllers/empresaController");

// multer simples p/ uploads/ (mesmo caminho que você já usa)
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

// app.js: app.use("/api/empresa", empresaRoutes)
router.post("/importar-admin", authCliente, empresaController.importarDoAdmin);

router.get("/", authCliente, empresaController.getEmpresa);
router.put(
  "/",
  authCliente,
  upload.single("logo"),
  empresaController.atualizarEmpresa
);

router.post("/enderecos", authCliente, empresaController.criarEndereco);
router.put("/enderecos/:id", authCliente, empresaController.atualizarEndereco);
router.delete("/enderecos/:id", authCliente, empresaController.excluirEndereco);

module.exports = router;
