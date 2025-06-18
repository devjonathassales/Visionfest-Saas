const { DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

class Cliente extends Model {}

Cliente.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING(14), // "000.000.000-00"
      allowNull: false,
      unique: true,
    },
    whatsapp: {
      type: DataTypes.STRING(15), // "(00) 00000-0000"
      allowNull: false,
    },
    celular: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "data_nascimento",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cep: {
      type: DataTypes.STRING(9),
      allowNull: true,
    },
    logradouro: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    complemento: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bairro: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cidade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Cliente",
    tableName: "clientes",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Cliente;
