const { Sequelize, DataTypes } = require("sequelize");

// Configuração do banco principal (admin)
const sequelize = new Sequelize(
  process.env.DB_PRINCIPAL_NAME,
  process.env.DB_PRINCIPAL_USER,
  process.env.DB_PRINCIPAL_PASS,
  {
    host: process.env.DB_PRINCIPAL_HOST,
    dialect: "postgres", // ou mysql, sqlserver, etc conforme seu banco
    logging: false,
  }
);

// Define o model Empresa direto aqui, usando a conexão já criada
const Empresa = sequelize.define(
  "Empresa",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpfCnpj: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    dominio: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("ativo", "bloqueado", "aguardando_pagamento"),
      defaultValue: "aguardando_pagamento",
    },
    bancoDados: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cep: DataTypes.STRING,
    endereco: DataTypes.STRING,
    bairro: DataTypes.STRING,
    cidade: DataTypes.STRING,
    uf: DataTypes.STRING,
    whatsapp: DataTypes.STRING,
    instagram: DataTypes.STRING,
    email: DataTypes.STRING,
    logoUrl: DataTypes.STRING,
    planoId: {
      type: DataTypes.INTEGER,
      references: {
        model: "planos",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      allowNull: false,
    },
    usuarioSuperAdmin: DataTypes.STRING,
  },
  {
    tableName: "empresas",
    underscored: true,
  }
);

// Associações - se precisar mesmo aqui (exemplo)
Empresa.associate = (models) => {
  Empresa.belongsTo(models.Plano, { foreignKey: "planoId" });
};

module.exports = { sequelize, Empresa };
