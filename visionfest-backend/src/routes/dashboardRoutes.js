const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");

const dashboardController = require("../controllers/dashboardController");

// app.js monta: app.use("/api/dashboard", dashboardRoutes)
router.get("/", authCliente, dashboardController.dashboardResumo);

module.exports = router;
