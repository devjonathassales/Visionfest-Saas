// src/utils/dbUtils.js (admin)
const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const baseConfig = {
  host: process.env.DB_HOST || "localhost",
  dialect: "postgres",
  logging: false,
  username: process.env.DB_USER || "visionfest",
  password: process.env.DB_PASS || "visionfest",
  database: process.env.DB_NAME || "visionfestadmin",
};

/* ===================== helpers ===================== */

async function ensureEnumInSchema(
  sequelizeAdmin,
  schemaName,
  enumName,
  values
) {
  const valuesSql = values.map((v) => `'${v}'`).join(", ");
  await sequelizeAdmin.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = '${enumName}' AND n.nspname = '${schemaName}'
      ) THEN
        CREATE TYPE "${schemaName}".${enumName} AS ENUM(${valuesSql});
      END IF;
    END
    $$;
  `);
}

/** Carrega todos os .js recursivamente (exceto index.js) */
function listModelFilesRecursively(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // pule pastas comuns de migrações/seeders
      if (/migrations?|seeders?/i.test(entry.name)) continue;
      out.push(...listModelFilesRecursively(full));
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.endsWith(".js") &&
      entry.name !== "index.js"
    ) {
      out.push(full);
    }
  }
  return out;
}

/** Fallback: carrega cada arquivo de model recursivamente */
function fallbackLoadModelsRecursive(sequelizeTenant, modelsPath, schemaName) {
  console.log("↩️  Fallback: carregando models (recursivo) em", modelsPath);

  // deixe o schema visível para arquivos que checam no topo
  process.env.DB_SCHEMA = schemaName;
  process.env.SCHEMA = schemaName;
  process.env.POSTGRES_SCHEMA = schemaName;
  process.env.NODE_CONFIG__DB_SCHEMA = schemaName;

  const files = listModelFilesRecursively(modelsPath);

  for (const full of files) {
    try {
      delete require.cache[require.resolve(full)];
    } catch {}
    let def;
    try {
      def = require(full);
    } catch (e) {
      console.warn(`⚠️  Falha ao importar ${full}: ${e.message}`);
      continue;
    }

    // função exportada
    if (typeof def === "function") {
      // (sequelize, DataTypes, schema)
      if (def.length >= 3) {
        try {
          def(sequelizeTenant, DataTypes, schemaName);
          continue;
        } catch (e) {
          console.warn(
            `⚠️  ${path.basename(full)} falhou em (seq, DT, schema): ${
              e.message
            }`
          );
        }
      }
      // (sequelize, DataTypes)
      try {
        def(sequelizeTenant, DataTypes);
        continue;
      } catch (e) {
        console.warn(
          `⚠️  ${path.basename(full)} falhou em (seq, DT): ${e.message}`
        );
      }
    }

    // objeto com init(...)
    if (def && typeof def.init === "function") {
      try {
        if (def.init.length >= 3)
          def.init(sequelizeTenant, DataTypes, schemaName);
        else def.init(sequelizeTenant, DataTypes);
      } catch (e) {
        console.error(
          `Erro ao inicializar model ${path.basename(full)}: ${e.message}`
        );
      }
    }
  }
}

/** Aplica associations se existirem */
function applyAssociationsIfAny(sequelizeTenant) {
  const models = sequelizeTenant.models || {};
  Object.values(models).forEach((m) => {
    if (m && typeof m.associate === "function") {
      m.associate(models);
    }
  });
}

/** Grafo de dependências (BelongsTo + attributes.references) */
function buildDependencyGraphFromSequelize(sequelizeTenant) {
  const models = sequelizeTenant.models || {};
  const graph = new Map();
  const byTable = new Map();

  for (const m of Object.values(models)) {
    const tableObj = m.getTableName ? m.getTableName() : m.tableName || m.name;
    const tableName =
      typeof tableObj === "object" ? tableObj.tableName : String(tableObj);
    byTable.set(tableName, m.name);
  }

  for (const name of Object.keys(models)) graph.set(name, new Set());

  for (const [name, model] of Object.entries(models)) {
    if (model.associations) {
      for (const assoc of Object.values(model.associations)) {
        if (assoc.associationType === "BelongsTo" && assoc.target?.name) {
          graph.get(name).add(assoc.target.name);
        }
      }
    }
    for (const attrDef of Object.values(model.rawAttributes || {})) {
      const ref = attrDef.references;
      if (!ref) continue;

      let targetModelName = null;
      if (typeof ref.model === "string") {
        targetModelName =
          byTable.get(ref.model) || byTable.get(ref.model.toLowerCase());
      } else if (ref.model && ref.model.name) {
        targetModelName = ref.model.name;
      }
      if (targetModelName && targetModelName !== name && graph.has(name)) {
        graph.get(name).add(targetModelName);
      }
    }
  }

  return graph;
}

/** Kahn topo sort */
function topoSort(graph) {
  const indeg = new Map();
  for (const [n, deps] of graph) indeg.set(n, deps.size);

  const queue = [];
  for (const [n, d] of indeg) if (d === 0) queue.push(n);

  const ordered = [];
  while (queue.length) {
    const n = queue.shift();
    ordered.push(n);
    for (const [m, deps] of graph) {
      if (deps.has(n)) {
        deps.delete(n);
        indeg.set(m, indeg.get(m) - 1);
        if (indeg.get(m) === 0) queue.push(m);
      }
    }
  }
  const hasCycle = ordered.length !== graph.size;
  if (hasCycle) {
    const pendentes = [];
    for (const [n, deps] of graph) {
      if (!ordered.includes(n))
        pendentes.push({ model: n, dependeDe: [...deps] });
    }
    return { ordered, hasCycle, pendentes };
  }
  return { ordered, hasCycle: false, pendentes: [] };
}

/* ===================== principal ===================== */

async function createSchemaAndSyncModels(schemaName, adminUserData) {
  if (!schemaName || schemaName.toLowerCase() === "public") {
    throw new Error("Nome de schema inválido. 'public' não é permitido.");
  }

  const sequelizeAdmin = new Sequelize(baseConfig);

  try {
    // 1) Garantir schema + enums
    await sequelizeAdmin.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await ensureEnumInSchema(
      sequelizeAdmin,
      schemaName,
      "enum_usuarios_permissao",
      ["super_admin", "admin", "usuario"]
    );

    // 2) Conexão do tenant com search_path correto
    const sequelizeTenant = new Sequelize(
      baseConfig.database,
      baseConfig.username,
      baseConfig.password,
      {
        ...baseConfig,
        logging: false,
        searchPath: [schemaName, "public"],
        define: { schema: schemaName },
      }
    );

    await sequelizeTenant.query(`SET search_path TO "${schemaName}", public;`);

    // 3) Carregar models do cliente (IGNORA index.js SEMPRE)
    const modelsPath =
      process.env.CLIENT_MODELS_DIR &&
      fs.existsSync(process.env.CLIENT_MODELS_DIR)
        ? process.env.CLIENT_MODELS_DIR
        : path.resolve(__dirname, "../../../visionfest-backend/src/models");

    console.log(
      "📁 (Sem index.js) Carregando models do cliente em:",
      modelsPath
    );
    fallbackLoadModelsRecursive(sequelizeTenant, modelsPath, schemaName);

    // 4) Associations
    applyAssociationsIfAny(sequelizeTenant);

    const loaded = Object.keys(sequelizeTenant.models || {});
    console.log("✅ Models carregados:", loaded);
    if (loaded.length === 0) {
      throw new Error(
        `Nenhum model carregado de ${modelsPath}. ` +
          `Verifique a pasta ou defina CLIENT_MODELS_DIR apontando para /src/models do cliente.`
      );
    }

    // 5) Ordenar criação por dependências
    const graph = buildDependencyGraphFromSequelize(sequelizeTenant);
    const { ordered, hasCycle, pendentes } = topoSort(graph);

    console.log("🧭 Ordem de criação (resolvida):", ordered);

    const allModelNames = Object.keys(sequelizeTenant.models || {});
    const cyclicNames = new Set((pendentes || []).map((p) => p.model));
    const nonCyclicOrdered = ordered.filter((n) => !cyclicNames.has(n));
    const remainingCyclic = allModelNames.filter(
      (n) => !nonCyclicOrdered.includes(n)
    );

    if (hasCycle) {
      console.warn("⚠️ Ciclo(s) detectado(s), criando em duas fases.");
      console.table(pendentes);
    }

    // 1) cria tudo que é acíclico, na ordem topológica
    for (const modelName of nonCyclicOrdered) {
      const model = sequelizeTenant.models[modelName];
      if (!model) continue;
      await model.sync({ alter: false });
    }

    // 2) cria os modelos cíclicos por último (ex.: ContaReceber com self-FK)
    for (const modelName of remainingCyclic) {
      const model = sequelizeTenant.models[modelName];
      if (!model) continue;
      await model.sync({ alter: false });
    }

    // 6) Seed superadmin (no schema do cliente)
    if (
      adminUserData?.email &&
      adminUserData?.senhaSuperAdmin &&
      sequelizeTenant.models?.Usuario
    ) {
      const Usuario = sequelizeTenant.models.Usuario;
      const exists = await Usuario.findOne({
        where: { email: adminUserData.email.toLowerCase() },
      });
      if (!exists) {
        const senhaHash = await bcrypt.hash(adminUserData.senhaSuperAdmin, 10);
        await Usuario.create({
          nome: adminUserData.nome || "SuperAdmin",
          email: adminUserData.email.toLowerCase(),
          senhaHash,
          ativo: true,
          perfil: "superadmin",
        });
      }
    }

    await sequelizeTenant.close();
    console.log(`✅ Schema "${schemaName}" criado e sincronizado.`);
  } finally {
    await sequelizeAdmin.close();
  }
}

/**
 * NEW: abre uma conexão no schema do cliente, carrega os models do app do cliente,
 * aplica associations, executa o callback e fecha a conexão.
 * Não faz sync — use após createSchemaAndSyncModels.
 */
async function withTenantDb(schemaName, handler) {
  if (!schemaName || schemaName.toLowerCase() === "public") {
    throw new Error("Schema inválido para withTenantDb");
  }

  const sequelizeTenant = new Sequelize(
    baseConfig.database,
    baseConfig.username,
    baseConfig.password,
    {
      ...baseConfig,
      logging: false,
      searchPath: [schemaName, "public"],
      define: { schema: schemaName },
    }
  );

  await sequelizeTenant.query(`SET search_path TO "${schemaName}", public;`);

  const modelsPath =
    process.env.CLIENT_MODELS_DIR &&
    fs.existsSync(process.env.CLIENT_MODELS_DIR)
      ? process.env.CLIENT_MODELS_DIR
      : path.resolve(__dirname, "../../../visionfest-backend/src/models");

  // sempre usa o fallback recursivo (mesma estratégia do sync)
  fallbackLoadModelsRecursive(sequelizeTenant, modelsPath, schemaName);
  applyAssociationsIfAny(sequelizeTenant);

  const out = await handler({
    sequelize: sequelizeTenant,
    models: sequelizeTenant.models || {},
    Sequelize,
    DataTypes,
  });

  await sequelizeTenant.close();
  return out;
}

function getAdminSequelize() {
  return new Sequelize(
    baseConfig.database,
    baseConfig.username,
    baseConfig.password,
    {
      ...baseConfig,
      searchPath: ["public"],
      logging: false,
    }
  );
}

module.exports = {
  createSchemaAndSyncModels,
  getAdminSequelize,
  withTenantDb, // <= ADICIONADO
};
