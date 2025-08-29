// src/models/index.js
const fs = require("fs");
const path = require("path");
const { DataTypes } = require("sequelize");

module.exports = async (sequelize, schema) => {
  if (!schema || typeof schema !== "string" || !schema.trim()) {
    throw new Error("Schema inválido ou não informado");
  }
  const safeSchema = schema.replace(/"/g, "");
  console.log("Schema carregado:", safeSchema);

  // ✅ Cria o schema só se não existir (idempotente) e ajusta o search_path
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${safeSchema}";`);
  await sequelize.query(`SET search_path TO "${safeSchema}", public;`);

  // 🔹 Se no Sequelize do tenant você já passou: define: { schema: safeSchema }
  //     (como no seu multiTenantMiddleware), a linha acima (search_path) já resolve.
  //     Mesmo assim, reforçamos o schema em cada model após carregá-los.

  // Carrega todos os models *.js desta pasta (menos este index)
  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file !== "index.js" && file.endsWith(".js"));

  const db = { sequelize };

  for (const file of files) {
    const def = require(path.join(__dirname, file));
    if (typeof def === "function") {
      const model = def(sequelize, DataTypes);
      db[model.name] = model;
    }
  }

  // Associações (se existirem)
  Object.values(db).forEach((model) => {
    if (model && typeof model.associate === "function") {
      model.associate(db);
    }
  });

  // 🔒 Garante que cada model esteja no schema do tenant
  for (const model of Object.values(db)) {
    if (model && typeof model.schema === "function") {
      model.schema(safeSchema);
    }
  }

  return db;
};
