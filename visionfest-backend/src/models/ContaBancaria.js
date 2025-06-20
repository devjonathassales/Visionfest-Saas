const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const ContaBancaria = sequelize.define('ContaBancaria', {
  banco: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  agencia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conta: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chavePixTipo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chavePixValor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'contas_bancarias',
  timestamps: false,
});

module.exports = ContaBancaria;
