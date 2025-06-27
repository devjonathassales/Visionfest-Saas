module.exports = (sequelize, DataTypes) => {
  const Caixa = sequelize.define("Caixa", {
    aberto: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dataAbertura: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dataFechamento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return Caixa;
};
