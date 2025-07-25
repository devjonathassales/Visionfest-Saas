const express = require("express");
const router = express.Router();
const authController = require("../controllers/clienteAuthController");

router.post("/login", authController.login);

module.exports = router;
