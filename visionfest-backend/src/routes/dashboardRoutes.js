const express = require("express");
const router = express.Router();
const authEmpresa = require("../middlewares/authCliente");

// DASHBOARD
const dashboardController = require("../controllers/dashboardController");
router.get("/dashboard", authEmpresa, dashboardController.dashboardResumo);

module.exports = router;
