// src/routes/authClienteRoutes.js
const express = require("express");
const router = express.Router();

const multiTenantMiddleware = require("../middlewares/multiTenantMiddleware");
const authCliente = require("../middlewares/authCliente");

// Import do controller com fallback para .default
let ctrl = require("../controllers/authClienteController");
ctrl = ctrl && ctrl.default ? ctrl.default : ctrl;

const { login, refresh, me, logout } = ctrl || {};

// Sanity check: todo handler precisa ser função
const bad = [
  ["login", login],
  ["refresh", refresh],
  ["me", me],
  ["logout", logout],
].find(([_, fn]) => typeof fn !== "function");

if (bad) {
  console.error("[authClienteRoutes] Export inválido no controller:", {
    login: typeof login,
    refresh: typeof refresh,
    me: typeof me,
    logout: typeof logout,
  });
  throw new TypeError(
    "argument handler must be a function (verifique exports do authClienteController)"
  );
}

// ⚠️ NUNCA chame o handler aqui (sem parênteses)
// Correto: passar a função; Errado: login()
router.post("/login", multiTenantMiddleware, login);
router.post("/refresh", multiTenantMiddleware, refresh);
router.get("/me", multiTenantMiddleware, authCliente, me);
router.post("/logout", multiTenantMiddleware, authCliente, logout);

module.exports = router;
