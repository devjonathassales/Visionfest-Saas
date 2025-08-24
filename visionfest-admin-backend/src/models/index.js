const { Sequelize } = require("sequelize");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Conexão com o banco, forçando schema default (public) para o painel admin
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // alterar para true se quiser ver os SQLs
  define: {
    schema: process.env.DB_SCHEMA || "public", // garante que o painel admin use 'public'
  }
});

const db = { sequelize, Sequelize };

// Carrega todos os models da pasta atual, menos este index.js
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Executa associações (relacionamentos)
Object.values(db).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(db);
  }
});

module.exports = db;
