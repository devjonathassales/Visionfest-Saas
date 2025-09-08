// src/middlewares/multiTenantMiddleware.js
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const fs = require("fs");

const TENANT_CACHE = new Map();

/** Carrega models puros da pasta /src/models, ignorando index.js */
function loadModels(sequelize) {
  const models = {};
  const modelsDir = path.join(__dirname, "..", "models");

  for (const file of fs.readdirSync(modelsDir)) {
    if (!file.endsWith(".js")) continue;

    // ❗️Ignora agregadores ou helpers que não são models puros
    if (file.toLowerCase() === "index.js") continue;

    const full = path.join(modelsDir, file);
    const mod = require(full);
    const def = mod?.default || mod;

    if (typeof def !== "function") {
      console.warn(
        `[multiTenant] Ignorando "${file}" (export não é função de model).`
      );
      continue;
    }

    let model;
    try {
      // maioria dos seus models usa (sequelize, DataTypes)
      model = def(sequelize, DataTypes);
    } catch (e) {
      console.warn(
        `[multiTenant] Falha ao inicializar model de "${file}": ${e.message}`
      );
      continue;
    }

    if (!model || !model.name) {
      console.warn(`[multiTenant] Model inválido em "${file}" (sem name).`);
      continue;
    }

    models[model.name] = model;
  }

  // associações (se existirem)
  Object.values(models).forEach((m) => m.associate && m.associate(models));
  return models;
}

/** Garante schema, move models p/ schema e cria tabelas faltantes */
async function bindSchemaAndEnsure(sequelize, models, schema) {
  // cria schema (se não existir)
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

  // opcional: ajustar search_path (models já estarão qualificados por schema)
  await sequelize.query(`SET search_path TO "${schema}", public`);

  // move todos os models para o schema do tenant
  for (const m of Object.values(models)) {
    if (typeof m.schema === "function") m.schema(schema);
  }

  // cria tabelas que faltarem
  await sequelize.sync();

  // sanity check específico p/ "Usuarios" (case-sensitive com aspas)
  const [rows] = await sequelize.query(
    `SELECT to_regclass('"${schema}"."Usuarios"') AS reg;`
  );
  if (!rows?.[0]?.reg && models.Usuario) {
    await models.Usuario.sync();
  }
}

/** Inicializa (e cacheia) o bundle do tenant */
async function getOrInitTenant(dominio) {
  const tenantKey = String(dominio).trim().toLowerCase();
  if (!tenantKey) throw new Error("Domínio/tenant vazio.");

  const schema = `cliente_${tenantKey.replace(/\W/g, "_")}`;

  if (TENANT_CACHE.has(schema)) return TENANT_CACHE.get(schema);

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    dialect: "postgres",
  });
  await sequelize.authenticate();

  const models = loadModels(sequelize);
  await bindSchemaAndEnsure(sequelize, models, schema);

  const bundle = { sequelize, models, schema };
  TENANT_CACHE.set(schema, bundle);
  return bundle;
}

/** Middleware: resolve tenant, anexa req.db/req.models/req.bancoCliente */
module.exports = async function multiTenantMiddleware(req, res, next) {
  try {
    let dominio =
      (req.headers["x-tenant"] || "").toString().trim().toLowerCase() ||
      (req.query?.dominio || "").toString().trim().toLowerCase() ||
      (req.query?.tenant || "").toString().trim().toLowerCase() ||
      (process.env.DEFAULT_TENANT || "").toString().trim().toLowerCase();

    // fallback: subdomínio do origin/referer
    if (!dominio) {
      try {
        const host = new URL(req.headers.origin || req.headers.referer || "")
          .hostname;
        const parts = host.split(".");
        if (parts.length > 2) dominio = parts[0];
      } catch {}
    }

    if (!dominio) {
      return res.status(400).json({
        mensagem:
          "Tenant não informado (use X-Tenant, ?dominio ou DEFAULT_TENANT).",
      });
    }

    const { sequelize, models, schema } = await getOrInitTenant(dominio);
    req.db = sequelize;
    req.models = models;
    req.bancoCliente = schema;

    next();
  } catch (err) {
    console.error("[multiTenantMiddleware] Error:", err);
    return res
      .status(500)
      .json({ mensagem: "Falha no contexto do tenant.", detalhe: err.message });
  }
};
