// src/utils/tenant.js
const jwt = require("jsonwebtoken");
const { Sequelize } = require("sequelize");
const { sequelize: adminSequelize, Empresa } = require("../lib/adminDb");
const initModels = require("../models");

const tenantsCache = new Map();

function extractSubdomain(host) {
  if (!host) return null;
  const h = host.split(":")[0];
  const parts = h.split(".");
  if (parts.length <= 1) return null;
  return parts[0];
}

async function resolveEmpresaFromReq(req) {
  const idHeader = req.headers["x-empresa-id"];
  if (idHeader) {
    const e = await Empresa.findByPk(idHeader);
    if (e) return e;
  }
  const tenantHeader = req.headers["x-tenant"];
  if (tenantHeader) {
    const e = await Empresa.findOne({ where: { dominio: tenantHeader } });
    if (e) return e;
  }
  const sub = extractSubdomain(req.headers.host);
  if (sub) {
    const e = await Empresa.findOne({ where: { dominio: sub } });
    if (e) return e;
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    try {
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "visionfest_secret");
      if (decoded?.empresaId) {
        const e = await Empresa.findByPk(decoded.empresaId);
        if (e) return e;
      }
    } catch (_) {}
  }
  return null;
}

async function getTenantDb(schemaName) {
  if (tenantsCache.has(schemaName)) return tenantsCache.get(schemaName);
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    define: { schema: schemaName },
  });
  await sequelize.authenticate();
  const db = await initModels(sequelize, schemaName);
  tenantsCache.set(schemaName, db);
  return db;
}

module.exports = {
  resolveEmpresaFromReq,
  getTenantDb,
};
