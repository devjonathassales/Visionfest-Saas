module.exports = (sequelize, DataTypes) => {
  const EstoqueMovimentacao = sequelize.define(
    "EstoqueMovimentacao",
    {
      tipo: {
        type: DataTypes.ENUM("entrada", "saida"),
        allowNull: false,
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      data: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      produtoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "produtos", key: "id" },
      },
    },
    {
      tableName: "estoque_movimentacoes",
      indexes: [
        { fields: ["produtoId"] },
        { fields: ["data"] },
        { fields: ["produtoId", "data"] },
      ],
      timestamps: true,
    }
  );

  EstoqueMovimentacao.associate = (models) => {
    EstoqueMovimentacao.belongsTo(models.Produto, {
      foreignKey: "produtoId",
      as: "produto",
    });
  };

  return EstoqueMovimentacao;
};
