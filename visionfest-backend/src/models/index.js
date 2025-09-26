// src/models/index.js
const fs = require("fs");
const path = require("path");
const SequelizeLib = require("sequelize"); // para QueryTypes/Op/etc
const { DataTypes } = require("sequelize");

/**
 * Carrega e prepara os models do TENANT no schema informado.
 *
 * @param {Sequelize} sequelize  instancia do Sequelize já conectada
 * @param {string} schema        nome do schema do tenant (ex: cliente_acme)
 * @param {object} [opts]
 * @param {boolean} [opts.autoSync] Força sequelize.sync() após carregar (ou defina TENANT_AUTO_SYNC=true)
 */
module.exports = async (sequelize, schema, opts = {}) => {
  if (!schema || typeof schema !== "string" || !schema.trim()) {
    throw new Error("Schema inválido ou não informado");
  }
  const safeSchema = schema.replace(/"/g, "");
  const autoSync =
    typeof opts.autoSync === "boolean"
      ? opts.autoSync
      : String(process.env.TENANT_AUTO_SYNC || "").toLowerCase() === "true";

  console.log("Schema carregado:", safeSchema);

  // ✅ Cria o schema se não existir e ajusta search_path
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${safeSchema}";`);
  await sequelize.query(`SET search_path TO "${safeSchema}", public;`);

  // Carrega todos os models *.js desta pasta (menos este index.js)
  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file !== "index.js" && file.endsWith(".js"));

  const db = {
    sequelize,
    Sequelize: SequelizeLib,
    DataTypes,
  };

  // 1) Instanciar models
  for (const file of files) {
    const def = require(path.join(__dirname, file));
    if (typeof def === "function") {
      const model = def(sequelize, DataTypes);
      if (!model || !model.name) {
        console.warn(`[models] Ignorando arquivo sem model válido: ${file}`);
        continue;
      }
      // força o schema no model
      if (typeof model.schema === "function") {
        model.schema(safeSchema);
      }
      db[model.name] = model;
    }
  }

  // 2) Associações declarativas (associate) — se o model exportar
  Object.values(db).forEach((model) => {
    if (model && typeof model.associate === "function") {
      try {
        model.associate(db);
      } catch (e) {
        console.warn(
          `[models] Falha em model.associate (${model.name}):`,
          e.message
        );
      }
    }
  });

  // 3) Fallback de associações importantes (caso seus models não definam associate)
  //    — especialmente para FaturaSaaS, que usamos no MVP do VisionFest
  if (db.FaturaSaaS) {
    // empresaId
    if (db.Empresa && db.FaturaSaaS.rawAttributes?.empresaId) {
      // evita recriar association se já existe
      const hasEmpresaAssoc = Object.values(
        db.FaturaSaaS.associations || {}
      ).some((a) => a.as === "empresa");
      if (!hasEmpresaAssoc) {
        db.FaturaSaaS.belongsTo(db.Empresa, {
          foreignKey: "empresaId",
          as: "empresa",
        });
      }
    }
    // contratoClienteId
    if (db.ContratoCliente && db.FaturaSaaS.rawAttributes?.contratoClienteId) {
      const hasContratoAssoc = Object.values(
        db.FaturaSaaS.associations || {}
      ).some((a) => a.as === "contrato");
      if (!hasContratoAssoc) {
        db.FaturaSaaS.belongsTo(db.ContratoCliente, {
          foreignKey: "contratoClienteId",
          as: "contrato",
        });
      }
    }
  }

  // 4) Garante schema no *protótipo* de cada model (idempotente)
  for (const model of Object.values(db)) {
    if (model && typeof model.schema === "function") {
      model.schema(safeSchema);
    }
  }

  // 5) Sincronização opcional (útil no createSchemaAndSyncModels)
  if (autoSync) {
    try {
      await sequelize.sync();
      console.log(`✅ sync() concluído no schema "${safeSchema}"`);
    } catch (e) {
      console.warn(`⚠️  sync() falhou no schema "${safeSchema}":`, e.message);
    }
  }

  return db;
};
