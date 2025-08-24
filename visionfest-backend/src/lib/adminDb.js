// src/lib/adminDb.js
require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

// Conexão fixa no schema PUBLIC (painel administrativo)
const adminSequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  define: { schema: "public" },
});

// Modelo mínimo de Empresa só para lookup de tenant
const Empresa = adminSequelize.define(
  "Empresa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: DataTypes.STRING,
    dominio: DataTypes.STRING,
    bancoDados: { type: DataTypes.STRING, field: "banco_dados" },
    status: DataTypes.STRING,
  },
  {
    tableName: "empresas",
    underscored: true,
    timestamps: true,
  }
);

module.exports = { sequelize: adminSequelize, Empresa };
