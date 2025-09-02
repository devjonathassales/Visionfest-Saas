// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ IMPORTS
const multiTenantMiddleware = require("./middlewares/multiTenantMiddleware"); // export default (module.exports = fn)
const authCliente = require("./middlewares/authCliente");

// ✅ use somente o router unificado de auth
const authRoutes = require("./routes/authRoutes");

// Demais rotas protegidas
const clienteRoutes = require("./routes/clienteRoutes");
const fornecedorRoutes = require("./routes/fornecedorRoutes");
const funcionarioRoutes = require("./routes/funcionarioRoutes");
const produtosRoutes = require("./routes/produtoRoutes");
const estoqueRoutes = require("./routes/estoqueRoutes");
const centroCustoRoutes = require("./routes/centroCustoRoutes");
const cartoesCreditoRoutes = require("./routes/cartoesCreditoRoutes");
const contaBancariaRoutes = require("./routes/contaBancariaRoutes");
const contasPagarRoutes = require("./routes/contasPagarRoutes");
const contasReceberRoutes = require("./routes/contasReceberRoutes");
const caixaRoutes = require("./routes/caixaRoutes");
const empresaRoutes = require("./routes/empresaRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const permissoesRoutes = require("./routes/permissoesRoutes");
const contratosRouter = require("./routes/contratoRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// CORS (dev)
app.use(
  cors({
    origin: [
      /https?:\/\/([a-z0-9-]+)\.lvh\.me(?::\d+)?$/i,
      /https?:\/\/localhost(?::\d+)?$/i,
      /https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
    ],
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Debug do tenant (DEV)
app.get("/debug/tenant", async (req, res) => {
  try {
    const { Empresa } = require("./lib/adminDb");
    const dominio = (
      req.headers["x-tenant"] ||
      req.query?.dominio ||
      req.query?.tenant ||
      process.env.DEFAULT_TENANT ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    const empresa = await Empresa.findOne({ where: { dominio } });
    if (!empresa) {
      return res
        .status(404)
        .json({ ok: false, dominio, reason: "empresa_nao_encontrada" });
    }

    return res.json({
      ok: true,
      dominio,
      empresaId: empresa.id,
      schema: empresa.bancoDados,
      status: empresa.status,
    });
  } catch (e) {
    console.error("[/debug/tenant] erro:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// 🔑 Fallback de tenant só para /api/cliente (login/refresh/me/logout)
app.use("/api/cliente", (req, _res, next) => {
  if ((req.headers["x-tenant"] ?? "").toString().trim()) return next();

  let dominio =
    req.query?.dominio ||
    req.query?.tenant ||
    req.body?.dominio ||
    req.body?.tenant ||
    "";

  if (!dominio) {
    try {
      const host = new URL(req.headers.origin || req.headers.referer || "")
        .hostname;
      const parts = host.split(".");
      if (parts.length > 2) dominio = parts[0];
    } catch {}
  }

  if (!dominio && process.env.DEFAULT_TENANT)
    dominio = process.env.DEFAULT_TENANT;

  if (dominio) {
    req.headers["x-tenant"] = String(dominio).trim().toLowerCase();
  }

  console.log(
    "[/api/cliente fallback] x-tenant =",
    req.headers["x-tenant"] || null
  );
  next();
});

// 🔓 Rotas públicas de autenticação (únicas)
app.use("/api/cliente", authRoutes);

// 🔐 Tudo abaixo exige tenant + token
if (typeof multiTenantMiddleware !== "function") {
  console.error(
    "ERRO: multiTenantMiddleware não é uma função. Verifique o export em src/middlewares/multiTenantMiddleware.js"
  );
}
app.use(multiTenantMiddleware, authCliente);

// Rotas protegidas
app.use("/api/clientes", clienteRoutes);
app.use("/api/fornecedores", fornecedorRoutes);
app.use("/api/funcionarios", funcionarioRoutes);
app.use("/api/produtos", produtosRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/centrocusto", centroCustoRoutes);
app.use("/api/cartoes-credito", cartoesCreditoRoutes);
app.use("/api/contas-bancarias", contaBancariaRoutes);
app.use("/api/contas-pagar", contasPagarRoutes);
app.use("/api/contas-receber", contasReceberRoutes);
app.use("/api/caixa", caixaRoutes);
app.use("/api/empresa", empresaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/permissoes", permissoesRoutes);
app.use("/api/contratos", contratosRouter);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;
