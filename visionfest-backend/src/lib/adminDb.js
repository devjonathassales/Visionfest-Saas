// src/lib/adminDb.js
require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

// Conexão única com o BANCO DO PAINEL (schema public)
const adminSequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  define: { schema: "public" },
});

// ✅ Modelo da Empresa do PAINEL (snake_case mapeado via `field`)
const Empresa = adminSequelize.define(
  "Empresa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING },
    cpfCnpj: { type: DataTypes.STRING, field: "cpf_cnpj" }, // <- painel
    dominio: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("ativo", "bloqueado", "aguardando_pagamento"),
    },
    bancoDados: { type: DataTypes.STRING, field: "banco_dados" }, // <- painel
  },
  {
    tableName: "empresas",
    schema: "public",
    underscored: true, // created_at / updated_at
    timestamps: true,
    freezeTableName: true,
  }
);

module.exports = {
  sequelize: adminSequelize,
  Empresa,
};
