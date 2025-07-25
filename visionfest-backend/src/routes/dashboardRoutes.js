const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authEmpresa");

// DASHBOARD
const dashboardController = require("../controllers/dashboardController");
router.get("/dashboard", authEmpresa, dashboardController.dashboardResumo);

module.exports = router;
