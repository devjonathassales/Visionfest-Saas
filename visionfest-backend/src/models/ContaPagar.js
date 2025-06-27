module.exports = (sequelize, DataTypes) => {
  const ContaPagar = sequelize.define(
    "ContaPagar",
    {
      descricao: DataTypes.STRING,
      centroCustoId: DataTypes.INTEGER,
      fornecedorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vencimento: DataTypes.DATEONLY,
      dataPagamento: DataTypes.DATEONLY,
      valor: DataTypes.DECIMAL(10, 2),
      desconto: DataTypes.DECIMAL(10, 2),
      tipoDesconto: DataTypes.STRING,
      valorTotal: DataTypes.DECIMAL(10, 2),
      status: { type: DataTypes.STRING, defaultValue: "aberto" },
      formaPagamento: DataTypes.STRING,
      contaBancariaId: DataTypes.INTEGER,
      valorPago: DataTypes.DECIMAL(10, 2),
      troco: DataTypes.DECIMAL(10, 2),
      tipoCredito: DataTypes.STRING,
      parcelas: DataTypes.INTEGER,
    },
    {
      tableName: "contas_pagar",
    }
  );

  ContaPagar.associate = (models) => {
    ContaPagar.belongsTo(models.CentroCusto, {
      foreignKey: "centroCustoId",
      as: "centroCusto",
    });
    ContaPagar.belongsTo(models.ContaBancaria, {
      foreignKey: "contaBancariaId",
      as: "contaBancaria",
    });
    ContaPagar.belongsTo(models.Fornecedor, {
      foreignKey: "fornecedorId",
      as: "fornecedor",
    });
  };

  return ContaPagar;
};
