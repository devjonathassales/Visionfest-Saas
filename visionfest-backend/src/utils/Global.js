// models/global.js
const { DataTypes } = require("sequelize");
const globalAdminDb = require("./globalAdminDb");

const Empresa = globalAdminDb.define("Empresa", {
  nome: { type: DataTypes.STRING, allowNull: false },
  documento: { type: DataTypes.STRING, allowNull: false },
  whatsapp: DataTypes.STRING,
  telefone: DataTypes.STRING,
  email: DataTypes.STRING,
  instagram: DataTypes.STRING,
  logo: DataTypes.STRING,
  bancoDados: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM("ativo", "bloqueado", "aguardando_pagamento"),
    defaultValue: "aguardando_pagamento",
  },
  planoId: {
    type: DataTypes.INTEGER,
    allowNull: true, // depende do seu fluxo
  },
  usuarioSuperAdmin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dataAtivacao: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "Empresas",
  timestamps: true, // ou false, conforme o admin define
});

module.exports = { Empresa };
