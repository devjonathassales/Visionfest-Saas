module.exports = (sequelize, DataTypes) => {
  const SaidaManual = sequelize.define("SaidaManual", {
    descricao: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    formaPagamento: {
      type: DataTypes.ENUM("dinheiro"),
      allowNull: false,
      defaultValue: "dinheiro",
    },
    data: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  return SaidaManual;
};
