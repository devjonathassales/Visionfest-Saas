module.exports = (sequelize, DataTypes) => {
  const EntradaManual = sequelize.define("EntradaManual", {
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

  return EntradaManual;
};
