module.exports = (sequelize, DataTypes) => {
  const ContaPagar = sequelize.define(
    "ContaPagar",
    {
      descricao: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      centroCustoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fornecedor: {
        type: DataTypes.STRING, // Campo livre
        allowNull: true,
      },
      vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dataPagamento: DataTypes.DATEONLY,
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      desconto: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      tipoDesconto: {
        type: DataTypes.STRING,
        defaultValue: "valor",
      },
      valorTotal: {
        type: DataTypes.DECIMAL(10, 2),
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "aberto",
      },
      formaPagamento: DataTypes.STRING,
      contaBancariaId: DataTypes.INTEGER,
      valorPago: DataTypes.DECIMAL(10, 2),
      troco: DataTypes.DECIMAL(10, 2),
      tipoCredito: DataTypes.STRING,
      parcelas: DataTypes.INTEGER,
      referenciaId: DataTypes.INTEGER,
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
};

  return ContaPagar;
};
