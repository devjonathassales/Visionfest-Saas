const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Login (público)
router.post("/login", authController.login);

// Rota protegida para buscar dados do usuário autenticado
router.get("/me", authMiddleware, authController.getProfile);

module.exports = router;
