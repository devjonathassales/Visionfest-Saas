module.exports = (sequelize, DataTypes) => {
  const ContratoProduto = sequelize.define("ContratoProduto", {
    contratoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    produtoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    dataEvento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "contrato_produtos",
    indexes: [
      { fields: ["produtoId"] },
      { fields: ["dataEvento"] },
      { fields: ["produtoId", "dataEvento"] },
    ],
    timestamps: false,
  });

  ContratoProduto.associate = (models) => {
    ContratoProduto.belongsTo(models.Contrato, { foreignKey: "contratoId" });
    ContratoProduto.belongsTo(models.Produto, { foreignKey: "produtoId" });
  };

  return ContratoProduto;
};
