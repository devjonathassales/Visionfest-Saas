module.exports = (sequelize, DataTypes) => {
  const ContratoProduto = sequelize.define(
    "ContratoProduto",
    {
      contratoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "contrato_id", // 👈 coluna no banco
        references: {
          model: "contratos",
          key: "id",
        },
      },
      produtoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "produto_id", // 👈 coluna no banco
        references: {
          model: "produtos",
          key: "id",
        },
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: "quantidade",
      },
      dataEvento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "data_evento", // 👈 coluna no banco
      },
    },
    {
      tableName: "contrato_produtos",
      timestamps: false,
    }
  );

  ContratoProduto.associate = (models) => {
    ContratoProduto.belongsTo(models.Contrato, {
      foreignKey: "contratoId",
      as: "contrato",
    });
    ContratoProduto.belongsTo(models.Produto, {
      foreignKey: "produtoId",
      as: "produto",
    });
  };

  return ContratoProduto;
};
