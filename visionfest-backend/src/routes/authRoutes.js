// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authCliente = require("../middlewares/authCliente");

// Fallback DEV para garantir o X-Tenant quando vier por query/body/.env
router.use((req, _res, next) => {
  if (!req.headers["x-tenant"]) {
    const dom =
      req.query?.dominio ||
      req.body?.dominio ||
      process.env.DEFAULT_TENANT ||
      "";
    if (dom) req.headers["x-tenant"] = String(dom).trim().toLowerCase();
  }
  next();
});

// Públicas
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

// Protegidas (token do cliente)
router.get("/me", authCliente, authController.me);
router.post("/logout", authCliente, authController.logout);

module.exports = router;
