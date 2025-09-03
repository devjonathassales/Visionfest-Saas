const fs = require("fs");
const path = require("path");
const multer = require("multer");

const dir = path.join(__dirname, "..", "uploads", "suporte");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const uploadSuporte = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB, até 5 arquivos
});

module.exports = uploadSuporte;
