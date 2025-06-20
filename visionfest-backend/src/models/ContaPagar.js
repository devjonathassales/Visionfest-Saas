const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const ContaPagar = sequelize.define("ContaPagar", {
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  centroCustoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  desconto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  tipoDesconto: {
    type: DataTypes.STRING, // "valor" ou "percentual"
    allowNull: true,
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "aberto",
  },
  formaPagamento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contaBancariaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  valorPago: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  troco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: "contas_pagar",
});

// Relacionamento com Centro de Custo
ContaPagar.associate = (models) => {
  ContaPagar.belongsTo(models.CentroCusto, {
    foreignKey: "centroCustoId",
    as: "centroCusto",
  });
};

module.exports = ContaPagar;
