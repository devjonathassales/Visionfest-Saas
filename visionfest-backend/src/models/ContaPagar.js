module.exports = (sequelize, DataTypes) => {
  const ContaPagar = sequelize.define(
    "ContaPagar",
    {
      descricao: DataTypes.STRING,
      centroCustoId: DataTypes.INTEGER,
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
  };

  return ContaPagar;
};
