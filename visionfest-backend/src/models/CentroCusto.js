const { DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

const CentroCusto = sequelize.define('CentroCusto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('Custo', 'Receita', 'Ambos'),
    allowNull: false,
  },
}, {
  tableName: 'centros_custo',
  timestamps: false,
});

module.exports = CentroCusto;