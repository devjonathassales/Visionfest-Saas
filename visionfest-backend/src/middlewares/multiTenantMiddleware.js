const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const tenants = {}; // cache das conexões por empresa

async function getTenantConnection(empresaId) {
  if (tenants[empresaId]) return tenants[empresaId]; // já existe

  const config = {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialect: "postgres",
    logging: false,
  };

  const dbName = `visionfest_${empresaId}`; // banco separado por empresa
  const sequelize = new Sequelize(dbName, config.username, config.password, config);

  const db = { sequelize, Sequelize };

  // Carrega models
  const modelsPath = path.resolve(__dirname, "../models");
  fs.readdirSync(modelsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js")
    .forEach((file) => {
      const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  // Executa associate
  Object.values(db).forEach((model) => {
    if (typeof model.associate === "function") {
      model.associate(db);
    }
  });

  await sequelize.authenticate();
  console.log(`✅ Banco carregado para empresa ${empresaId}`);

  tenants[empresaId] = db;
  return db;
}

module.exports = async function multiTenant(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token não fornecido." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const empresaId = decoded.empresaId;
    if (!empresaId) return res.status(401).json({ error: "Empresa inválida." });

    req.db = await getTenantConnection(empresaId);
    req.empresaId = empresaId;
    next();
  } catch (err) {
    console.error("Erro multi-tenant:", err);
    res.status(401).json({ error: "Acesso não autorizado." });
  }
};
