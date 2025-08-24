module.exports = (sequelize, DataTypes) => {
  const ContaBancaria = sequelize.define(
    "ContaBancaria",
    {
      banco: DataTypes.STRING,
      agencia: DataTypes.STRING,
      conta: DataTypes.STRING,
      chavePixTipo: DataTypes.STRING,
      chavePixValor: DataTypes.STRING,
    },
    {
      tableName: "contas_bancarias",
      timestamps: true,
    }
  );

  return ContaBancaria;
};
