const express = require("express");
const router = express.Router();
const empresaController = require("../controllers/empresaController");
const multer = require("multer");
const path = require("path");

// Configuração Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = Date.now() + ext;
    cb(null, nome);
  },
});
const upload = multer({ storage });

// Rotas
router.get("/todas", empresaController.listarTodas); // ✅ Listar todas
router.get("/:id", empresaController.buscar);        // Buscar por ID
router.get("/", empresaController.buscar);           // Buscar uma empresa (fallback)

router.post("/", upload.single("logo"), empresaController.criarOuAtualizar);        // Criar
router.put("/:id", upload.single("logo"), empresaController.criarOuAtualizar);      // Atualizar
router.delete("/:id", empresaController.deletar);                                    // Excluir

module.exports = router;
