// models/Assinatura.js (ADMIN)
module.exports = (sequelize, DataTypes) => {
  const Assinatura = sequelize.define(
    "Assinatura",
    {
      empresaId: { type: DataTypes.INTEGER, allowNull: false },
      planoId: { type: DataTypes.INTEGER, allowNull: false },
      dataInicio: { type: DataTypes.DATE, allowNull: false },
      dataFim: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ativa",
      }, // ativa|trial|encerrada|cancelamento_pendente
      renovacaoAutomatica: { type: DataTypes.BOOLEAN, defaultValue: true },
      metodoPagamento: { type: DataTypes.STRING, defaultValue: "pix" },
    },
    {
      tableName: "assinaturas",
      underscored: true,
    }
  );

  Assinatura.associate = (models) => {
    Assinatura.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
    Assinatura.belongsTo(models.Plano, { foreignKey: "planoId", as: "plano" });
  };

  return Assinatura;
};
