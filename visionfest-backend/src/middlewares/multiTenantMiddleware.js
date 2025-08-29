// src/middlewares/multiTenantMiddleware.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

// Conexão do painel (schema public)
const { sequelize: adminSequelize, Empresa } = require("../lib/adminDb");

// Inicializador de models do tenant (src/models/index.js exporta uma função (sequelize, schema) => db)
const initModels = require("../models");

const tenantsCache = new Map();

/** Descobre o tenant a partir de header/host. (sem DEFAULT_TENANT aqui) */
function getTenantFromRequest(req) {
  // 1) Header explícito
  const explicit = req.headers["x-tenant"];
  if (explicit && typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().toLowerCase();
  }

  // 2) Subdomínio
  const host = (req.headers.host || "").split(":")[0];
  const [sub] = host.split(".");
  if (sub && sub.toLowerCase() !== "localhost") {
    return sub.toLowerCase();
  }

  return null;
}

/** Abre/recupera conexão do schema do cliente a partir do domínio */
async function getTenantDbByDomain(dominio) {
  if (!dominio) throw new Error("Domínio do tenant não informado.");

  // cache
  if (tenantsCache.has(dominio)) return tenantsCache.get(dominio);

  // garante conexão com painel
  await adminSequelize.authenticate();

  // empresa no painel (schema public)
  const empresa = await Empresa.findOne({ where: { dominio } });
  if (!empresa || !empresa.bancoDados) {
    throw new Error("Empresa não encontrada ou bancoDados ausente.");
  }

  const schemaName = empresa.bancoDados; // ex.: "cliente_visionware"

  // cria conexão para o schema do cliente
  const tenantSequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    define: { schema: schemaName },
  });

  // inicializa models do tenant
  const db = await initModels(tenantSequelize, schemaName);
  await tenantSequelize.authenticate();

  const tenantObj = {
    sequelize: tenantSequelize,
    db,
    schema: schemaName,
    empresa,
  };
  tenantsCache.set(dominio, tenantObj);
  return tenantObj;
}

/** 🔐 Middleware multi-tenant (usar APÓS rotas públicas) */
async function multiTenantMiddleware(req, res, next) {
  try {
    const dominio = getTenantFromRequest(req);
    if (!dominio) {
      return res
        .status(400)
        .json({
          error:
            "Domínio do tenant não identificado (use subdomínio ou header X-Tenant).",
        });
    }

    const tenant = await getTenantDbByDomain(dominio);

    req.tenant = {
      dominio,
      schema: tenant.schema,
      empresa: tenant.empresa,
      sequelize: tenant.sequelize,
    };
    req.db = tenant.db; // models do cliente

    return next();
  } catch (err) {
    console.error("Erro no multiTenantMiddleware:", err.message);
    return res.status(401).json({ error: "Acesso não autorizado ao tenant." });
  }
}

// ✅ export como FUNÇÃO (default do CommonJS)
module.exports = multiTenantMiddleware;
