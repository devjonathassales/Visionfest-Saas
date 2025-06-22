module.exports = (sequelize, DataTypes) => {
  const CartaoCredito = sequelize.define(
    "CartaoCredito",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      banco: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      taxaVista: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      taxaParcelado: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      taxaDebito: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
    },
    {
      tableName: "cartoes_credito",
      timestamps: false,
    }
  );

  return CartaoCredito;
};
