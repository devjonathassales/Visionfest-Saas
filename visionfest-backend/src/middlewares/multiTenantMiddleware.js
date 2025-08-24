// src/middlewares/multiTenantMiddleware.js
require("dotenv").config();
const { Sequelize } = require("sequelize");
const jwt = require("jsonwebtoken");

// IMPORTAÇÃO ÚNICA do banco do painel (schema public)
const { sequelize: adminSequelize, Empresa } = require("../lib/adminDb");

// Função de inicialização dos models do APP do cliente (seu index exporta uma função)
const initModels = require("../models"); // seu src/models/index.js que recebe (sequelize, schema)

const tenantsCache = new Map();

/**
 * Extrai o tenant (domínio) do host ou do header x-tenant.
 */
function getTenantFromRequest(req) {
  // 1) Header tem prioridade
  const explicit = req.headers["x-tenant"];
  if (explicit && typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().toLowerCase();
  }

  // 2) Host/subdomínio: cliente.exemplo.com -> "cliente"
  const host = req.headers.host || "";
  const [subdomain] = host.split(":")[0].split(".");
  if (subdomain && subdomain.toLowerCase() !== "localhost") {
    return subdomain.toLowerCase();
  }

  // 3) Fallback (opcional): usar variável de ambiente
  if (process.env.DEFAULT_TENANT) {
    return process.env.DEFAULT_TENANT.toLowerCase();
  }

  return null;
}

/**
 * Busca/Cria conexão do tenant por domínio (tabela empresas no PUBLIC).
 */
async function getTenantDbByDomain(dominio) {
  if (!dominio) throw new Error("Domínio do tenant não informado.");

  // Cache por domínio
  if (tenantsCache.has(dominio)) {
    return tenantsCache.get(dominio);
  }

  // Garante conexão com o banco admin (public)
  await adminSequelize.authenticate();

  // Busca a empresa pelo domínio
  const empresa = await Empresa.findOne({ where: { dominio: dominio } });
  if (!empresa || !empresa.bancoDados) {
    throw new Error("Empresa não encontrada ou bancoDados ausente.");
  }

  const schemaName = empresa.bancoDados; // ex: "cliente_visionware"

  // Cria nova conexão para o schema do cliente
  const tenantSequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    define: { schema: schemaName }, // define default schema
  });

  // Inicializa os models do cliente nesse schema
  const db = await initModels(tenantSequelize, schemaName);
  await tenantSequelize.authenticate();

  const tenantObj = { sequelize: tenantSequelize, db, schema: schemaName, empresa };
  tenantsCache.set(dominio, tenantObj);
  return tenantObj;
}

/**
 * Middleware multi-tenant:
 * - Descobre o domínio do tenant (x-tenant ou subdomínio)
 * - Valida token se a rota for protegida (opcional: você pode manter outro middleware de auth)
 * - Injeta req.tenant e req.db (models do cliente)
 */
module.exports = async function multiTenantMiddleware(req, res, next) {
  try {
    const dominio = getTenantFromRequest(req);
    if (!dominio) {
      return res.status(400).json({ error: "Domínio do tenant não identificado (use host ou header x-tenant)." });
    }

    // Se a sua API exigir token aqui, você pode validar:
    // const token = req.headers.authorization?.split(" ")[1];
    // if (!token) return res.status(401).json({ error: "Token não fornecido." });
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tenant = await getTenantDbByDomain(dominio);

    // Anexa no request
    req.tenant = {
      dominio,
      schema: tenant.schema,
      empresa: tenant.empresa,
      sequelize: tenant.sequelize,
    };
    req.db = tenant.db; // seus models do cliente (Cliente, Usuario, etc.)

    return next();
  } catch (err) {
    console.error("Erro no multiTenantMiddleware:", err.message);
    return res.status(401).json({ error: "Acesso não autorizado ao tenant." });
  }
};
