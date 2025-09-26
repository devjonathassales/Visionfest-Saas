require("dotenv").config();
const { Sequelize } = require("sequelize");
const { sequelize: adminSequelize, Empresa } = require("../lib/adminDb");
const initModels = require("../models");

/** Remove prefixos tipo "cliente_" ou "cliente-" */
function normalizeDominio(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/^cliente[_-]/, "");
}

/** Extrai subdomínio, ex.: visionware.lvh.me -> visionware */
function pickSubdomain(host) {
  if (!host) return null;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(host)) return null;
  const parts = String(host).split(".");
  return parts.length > 2 ? parts[0].toLowerCase() : null;
}

/**
 * Resolve o domínio (tenant) a partir de várias fontes.
 * Aceita:
 *  - string (domínio direto)
 *  - req (padrão Express)
 *  - objeto “parecido com req” (com headers/query/body)
 */
function resolveDominioFromReq(input) {
  // 0) Se já veio uma string (domínio), normalize e retorne
  if (typeof input === "string") {
    const dom = normalizeDominio(input);
    return dom || null;
  }

  // 1) Tenta ler de headers/query/body de forma segura
  const req = input || {};
  const headers = req?.headers || {};
  const query = req?.query || {};
  const body = req?.body || {};

  const h = normalizeDominio(headers["x-tenant"] || headers["x-dominio"]);
  if (h) return h;

  const q = normalizeDominio(query.dominio || query.tenant);
  if (q) return q;

  const b = normalizeDominio(body.dominio || body.tenant);
  if (b) return b;

  // 2) ORIGIN / REFERER (ex.: http://visionware.lvh.me:5173)
  try {
    const originUrl = new URL(headers.origin || headers.referer || "");
    const sub = normalizeDominio(pickSubdomain(originUrl.hostname));
    if (sub) return sub;
  } catch {}

  // 3) host da própria request (se a API estiver sob subdomínio)
  try {
    const hostHeader = String(headers.host || "").split(":")[0];
    const fromHost = normalizeDominio(pickSubdomain(hostHeader));
    if (fromHost) return fromHost;
  } catch {}

  // 4) fallback DEV
  const def = normalizeDominio(process.env.DEFAULT_TENANT);
  return def || null;
}

/** Busca a empresa (schema public/admin) a partir do domínio resolvido */
async function resolveEmpresaFromReq(input) {
  const dominio = resolveDominioFromReq(input); // já normalizado
  if (!dominio) {
    const e = new Error("dominio_ausente");
    e.meta = { where: "resolveEmpresaFromReq" };
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
    e.meta = { dominio, status: empresa.status };
    throw e;
  }
  if (!empresa.bancoDados) {
    const e = new Error("empresa_sem_banco");
    e.meta = { dominio };
    throw e;
  }

  return empresa;
}

/** Cache de conexões (por schema) para o tenant */
const tenantCache = new Map();

/** Abre (ou reutiliza) o DB do tenant e carrega os models do CLIENTE */
async function getTenantDb(schema) {
  const schemaName = String(schema || "").trim();
  if (!schemaName) throw new Error("schema_invalido");

  if (tenantCache.has(schemaName)) return tenantCache.get(schemaName);

  const tenantSequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    define: { schema: schemaName },
  });

  // initModels cria o schema (se preciso), seta search_path e registra models
  const db = await initModels(tenantSequelize, schemaName);
  await tenantSequelize.authenticate();
  db.sequelize = tenantSequelize;

  tenantCache.set(schemaName, db);
  return db;
}

/**
 * ✅ getDbCliente: aceita:
 *  - req (Express)
 *  - string (domínio)
 * Retorna { sequelize, models:{...} } do tenant e pendura no req (se houver).
 */
async function getDbCliente(input) {
  // Se já veio um db pendurado no req (middleware), reutiliza
  if (input && typeof input === "object" && input.tenantDb)
    return input.tenantDb;

  // Resolve empresa a partir do req OU do domínio string
  const empresa = await resolveEmpresaFromReq(input);

  // Abre o DB do tenant
  const db = await getTenantDb(empresa.bancoDados);

  // Se houver req, deixa empresaId e tenantDb disponíveis no pipeline
  if (input && typeof input === "object") {
    input.tenantDb = db;
    input.empresaId = empresa.id;
  }

  return db;
}

module.exports = {
  resolveDominioFromReq,
  resolveEmpresaFromReq,
  getTenantDb,
  getDbCliente,
};
