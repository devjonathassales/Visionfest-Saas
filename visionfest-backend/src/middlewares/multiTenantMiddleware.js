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
    if (file.toLowerCase() === "index.js") continue; // ignora agregadores/helpers

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

/**
 * Patches idempotentes de estrutura (sem DO $$).
 * Evita exceções "coluna já existe" e funciona mesmo se a tabela não existir ainda.
 */
async function ensureTenantPatches(sequelize, schema) {
  // empresas.admin_empresa_id
  try {
    const [rows] = await sequelize.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = ${sequelize.escape(schema)}
         AND table_name   = 'empresas'
         AND column_name  = 'admin_empresa_id'`
    );

    if (!rows || rows.length === 0) {
      console.log(
        `[multiTenant] adicionando coluna ${schema}.empresas.admin_empresa_id`
      );
      await sequelize.query(
        `ALTER TABLE "${schema}"."empresas"
         ADD COLUMN IF NOT EXISTS admin_empresa_id INTEGER`
      );
    }
  } catch (e) {
    console.warn(`[multiTenant] patch empresas.admin_empresa_id: ${e.message}`);
  }

  // empresas.cpf_cnpj (com backfill a partir de documento)
  try {
    const [rows] = await sequelize.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = ${sequelize.escape(schema)}
         AND table_name   = 'empresas'
         AND column_name  = 'cpf_cnpj'`
    );
    if (!rows || rows.length === 0) {
      console.log(
        `[multiTenant] adicionando coluna ${schema}.empresas.cpf_cnpj`
      );
      await sequelize.query(
        `ALTER TABLE "${schema}"."empresas"
         ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(255)`
      );
      await sequelize.query(
        `UPDATE "${schema}"."empresas"
           SET cpf_cnpj = documento
         WHERE cpf_cnpj IS NULL AND documento IS NOT NULL`
      );
    }
  } catch (e) {
    console.warn(`[multiTenant] patch empresas.cpf_cnpj: ${e.message}`);
  }

  // empresas.dominio
  try {
    await sequelize.query(
      `ALTER TABLE "${schema}"."empresas"
       ADD COLUMN IF NOT EXISTS dominio VARCHAR(255)`
    );
  } catch (e) {
    console.warn(`[multiTenant] patch empresas.dominio: ${e.message}`);
  }

  // empresas.logo
  try {
    await sequelize.query(
      `ALTER TABLE "${schema}"."empresas"
       ADD COLUMN IF NOT EXISTS logo VARCHAR(255)`
    );
  } catch (e) {
    console.warn(`[multiTenant] patch empresas.logo: ${e.message}`);
  }

  // enderecos.admin_endereco_id (a tabela "enderecos" pode não existir ainda)
  try {
    await sequelize.query(
      `ALTER TABLE IF EXISTS "${schema}"."enderecos"
       ADD COLUMN IF NOT EXISTS admin_endereco_id INTEGER`
    );
  } catch (e) {
    console.warn(
      `[multiTenant] patch enderecos.admin_endereco_id: ${e.message}`
    );
  }

  // Diagnóstico opcional para tabela legada "Enderecos" (camel-case)
  try {
    const [chk] = await sequelize.query(`
      SELECT to_regclass('"${schema}"."Enderecos"') AS legacy_upper,
             to_regclass('"${schema}"."enderecos"') AS lower_ok;
    `);
    if (chk?.[0]?.legacy_upper && !chk?.[0]?.lower_ok) {
      console.warn(
        `[multiTenant] Alerta: tabela "${schema}"."Enderecos" existe, ` +
          `mas "enderecos" (minúsculo) não. Ajuste seus models para usar "enderecos".`
      );
    }
  } catch (e) {
    console.warn(`[multiTenant] check Enderecos vs enderecos: ${e.message}`);
  }
}

/** Garante schema, move models p/ schema e cria tabelas faltantes */
async function bindSchemaAndEnsure(sequelize, models, schema) {
  // cria schema e define search_path
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await sequelize.query(`SET search_path TO "${schema}", public`);

  // move todos os models para o schema do tenant
  for (const m of Object.values(models)) {
    if (typeof m.schema === "function") m.schema(schema);
  }

  // cria tabelas que faltarem
  await sequelize.sync();

  // sanity check específico p/ "Usuarios" (camel-case)
  const [rows] = await sequelize.query(
    `SELECT to_regclass('"${schema}"."Usuarios"') AS reg;`
  );
  if (!rows?.[0]?.reg && models.Usuario) {
    await models.Usuario.sync();
  }

  // patches idempotentes
  await ensureTenantPatches(sequelize, schema);
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
        if (parts.length > 2) dominio = parts[0].toLowerCase();
      } catch {}
    }

    if (!dominio) {
      return res.status(400).json({
        mensagem:
          "Tenant não informado (use X-Tenant, ?dominio ou DEFAULT_TENANT).",
      });
    }

    const { sequelize, models, schema } = await getOrInitTenant(dominio);

    // 🔒 Garantir o schema correto em CADA requisição (pool pode trocar a conexão)
    await sequelize.query(`SET search_path TO "${schema}", public`);

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
