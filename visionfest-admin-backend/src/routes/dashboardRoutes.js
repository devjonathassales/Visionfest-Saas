const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");
const { getDashboardData } = require("../controllers/dashboardController");

const router = express.Router();

router.use(authMiddleware);

// Protege o acesso ao dashboard
router.get(
  "/dashboard",
  verificarPermissao("visualizarDashboard"),
  getDashboardData
);

module.exports = router;
