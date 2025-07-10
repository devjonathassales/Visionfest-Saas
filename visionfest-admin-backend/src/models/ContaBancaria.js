module.exports = (sequelize, DataTypes) => {
  const ContaBancaria = sequelize.define("ContaBancaria", {
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
    chavePix: {
      type: DataTypes.JSONB, // para armazenar { tipo: 'CPF', valor: '...' }
      allowNull: true,
    },
  }, {
    tableName: "contas_bancarias",
    underscored: true,
  });

  return ContaBancaria;
};
