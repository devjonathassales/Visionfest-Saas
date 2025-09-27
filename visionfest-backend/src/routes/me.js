const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const meController = require("../controllers/meController");

// GET /api/me
router.get("/", authCliente, meController.me);

module.exports = router;
