const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");

const router = express.Router();

// Aplica middleware para proteger a rota
router.get("/dashboard", authMiddleware, getDashboardData);

module.exports = router;
