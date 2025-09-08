// models/SolicitacaoCancelamento.js (ADMIN)
module.exports = (sequelize, DataTypes) => {
  const SolicitacaoCancelamento = sequelize.define(
    "SolicitacaoCancelamento",
    {
      empresaId: { type: DataTypes.INTEGER, allowNull: false },
      motivo: { type: DataTypes.TEXT },
      valorMulta: { type: DataTypes.DECIMAL(10, 2) },
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
      tableName: "solicitacoes_cancelamento",
      underscored: true,
    }
  );

  SolicitacaoCancelamento.associate = (models) => {
    SolicitacaoCancelamento.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
  };

  return SolicitacaoCancelamento;
};
