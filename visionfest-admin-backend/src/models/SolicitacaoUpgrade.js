// models/SolicitacaoUpgrade.js (ADMIN)
module.exports = (sequelize, DataTypes) => {
  const SolicitacaoUpgrade = sequelize.define(
    "SolicitacaoUpgrade",
    {
      empresaId: { type: DataTypes.INTEGER, allowNull: false },
      planoDestinoId: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pendente",
      }, // pendente|aprovada|negada
      solicitadoEm: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      resolvidoEm: { type: DataTypes.DATE },
    },
    {
      tableName: "solicitacoes_upgrade",
      underscored: true,
    }
  );

  SolicitacaoUpgrade.associate = (models) => {
    SolicitacaoUpgrade.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
    SolicitacaoUpgrade.belongsTo(models.Plano, {
      foreignKey: "planoDestinoId",
      as: "planoDestino",
    });
  };

  return SolicitacaoUpgrade;
};
