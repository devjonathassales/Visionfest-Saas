const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Produto = require('./Produto');

const EstoqueMovimentacao = sequelize.define('EstoqueMovimentacao', {
  tipo: {
    type: DataTypes.ENUM('entrada', 'saida'),
    allowNull: false,
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'estoque_movimentacoes',
  timestamps: true,
});

// Relacionamento: uma movimentação pertence a um produto
EstoqueMovimentacao.belongsTo(Produto, {
  foreignKey: 'produtoId',
  as: 'produto',
});

module.exports = EstoqueMovimentacao;
