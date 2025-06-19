const { DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

const Produto = sequelize.define('Produto', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  movimentaEstoque: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  estoqueMinimo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  tipoProduto: {
    type: DataTypes.ENUM('venda', 'locacao'),
    allowNull: false,
    defaultValue: 'venda',
  },
}, {
  tableName: 'produtos',
});


module.exports = Produto;