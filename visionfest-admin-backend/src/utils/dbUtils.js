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

/**
 * Cria um schema isolado para o cliente e sincroniza models do app do cliente
 */
async function createSchemaAndSyncModels(schemaName, adminUserData) {
  if (!schemaName || schemaName.toLowerCase() === "public") {
    throw new Error("Nome de schema inválido. 'public' não é permitido.");
  }

  // Conexão principal para criar schema
  const sequelizeAdmin = new Sequelize(baseConfig);

  // ✅ 1. Criar schema do cliente, se não existir
  await sequelizeAdmin.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // ✅ 2. Criar enums no schema do cliente
  const enumsParaCriar = [
    {
      name: "enum_usuarios_permissao",
      values: ["super_admin", "admin", "usuario"],
    },
  ];

  for (const enumDef of enumsParaCriar) {
    await sequelizeAdmin.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = '${enumDef.name}' AND n.nspname = '${schemaName}'
        ) THEN
          CREATE TYPE "${schemaName}".${enumDef.name} AS ENUM(${enumDef.values
      .map((v) => `'${v}'`)
      .join(", ")});
        END IF;
      END
      $$;
    `);
  }

  // ✅ 3. Conexão para o schema do cliente
  const sequelizeSchema = new Sequelize(
    baseConfig.database,
    baseConfig.username,
    baseConfig.password,
    {
      ...baseConfig,
      define: { schema: schemaName },
      logging: false,
    }
  );

  // ✅ 4. Carregar models do cliente
  const modelsPath = path.resolve(
    __dirname,
    "../../../visionfest-backend/src/models"
  );
  const db = { sequelize: sequelizeSchema, Sequelize };

  const files = fs
    .readdirSync(modelsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of files) {
    const modelDef = require(path.join(modelsPath, file));
    const model =
      typeof modelDef === "function"
        ? modelDef(sequelizeSchema, DataTypes)
        : modelDef;
    db[model.name] = model;
  }

  // ✅ 5. Configurar associações
  Object.values(db).forEach((model) => {
    if (model.associate) {
      model.associate(db);
    }
  });

  // ✅ 6. Sincronizar models do cliente (sem afetar public)
  await sequelizeSchema.sync({ alter: true });

  // ✅ 7. Criar superadmin no schema do cliente
  if (db.Usuario && adminUserData) {
    const exists = await db.Usuario.findOne({
      where: { email: adminUserData.email },
    });
    if (!exists) {
      const hashedPassword = await bcrypt.hash(
        adminUserData.senhaSuperAdmin,
        10
      );
      await db.Usuario.create({
        nome: adminUserData.nome,
        email: adminUserData.email,
        senhaHash: hashedPassword,
        ativo: true,
        permissoes: { super_admin: true },
      });
    }
  }

  // Fechar conexões
  await sequelizeAdmin.close();
  await sequelizeSchema.close();

  console.log(`✅ Schema "${schemaName}" criado com tabelas sincronizadas.`);
  return db;
}

/**
 * Conexão apenas para o painel administrativo (schema public)
 */
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
};
