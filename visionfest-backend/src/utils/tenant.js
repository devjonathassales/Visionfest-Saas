// src/utils/tenant.js
require("dotenv").config();
const { Sequelize } = require("sequelize");
const { sequelize: adminSequelize, Empresa } = require("../lib/adminDb");
const initModels = require("../models");

function pickSubdomain(host) {
  if (!host) return null;
  // ignora host puro de dev
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(host)) return null;
  const parts = host.split(".");
  // subdomínio existe quando há 3+ partes (ex.: visionware.lvh.me)
  return parts.length > 2 ? parts[0].toLowerCase() : null;
}

function resolveDominioFromReq(req) {
  // 1) headers explícitos
  const h = (req.headers["x-tenant"] || req.headers["x-dominio"] || "")
    .toString()
    .trim()
    .toLowerCase();
  if (h) return h;

  // 2) query/body
  const q = (req.query?.dominio || req.query?.tenant || "")
    .toString()
    .trim()
    .toLowerCase();
  if (q) return q;
  const b = (req.body?.dominio || req.body?.tenant || "")
    .toString()
    .trim()
    .toLowerCase();
  if (b) return b;

  // 3) ORIGIN / REFERER (ex.: http://visionware.lvh.me:5173)
  try {
    const originUrl = new URL(req.headers.origin || req.headers.referer || "");
    const sub = pickSubdomain(originUrl.hostname);
    if (sub) return sub;
  } catch {}

  // 4) host da própria request (caso API esteja sob subdomínio do tenant)
  const subFromHost = pickSubdomain((req.hostname || "").split(":")[0]);
  if (subFromHost) return subFromHost;

  // 5) fallback dev
  if (process.env.DEFAULT_TENANT)
    return String(process.env.DEFAULT_TENANT).trim().toLowerCase();

  return null;
}

async function resolveEmpresaFromReq(req) {
  const dominio = resolveDominioFromReq(req);
  if (!dominio) {
    const e = new Error("dominio_ausente");
    throw e;
  }

  await adminSequelize.authenticate();
  const empresa = await Empresa.findOne({ where: { dominio } });
  if (!empresa) {
    const e = new Error("empresa_nao_encontrada");
    e.meta = { dominio };
    throw e;
  }
  if (empresa.status && empresa.status !== "ativo") {
    const e = new Error("empresa_inativa");
    e.meta = { dominio };
    throw e;
  }
  if (!empresa.bancoDados) {
    const e = new Error("empresa_sem_banco");
    e.meta = { dominio };
    throw e;
  }

  return empresa;
}

const tenantCache = new Map();
async function getTenantDb(schema) {
  const schemaName = String(schema || "").trim();
  if (!schemaName) throw new Error("schema_invalido");

  if (tenantCache.has(schemaName)) return tenantCache.get(schemaName);

  const tenantSequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    define: { schema: schemaName },
  });

  const db = await initModels(tenantSequelize, schemaName);
  await tenantSequelize.authenticate();
  db.sequelize = tenantSequelize;

  tenantCache.set(schemaName, db);
  return db;
}

module.exports = { resolveDominioFromReq, resolveEmpresaFromReq, getTenantDb };
