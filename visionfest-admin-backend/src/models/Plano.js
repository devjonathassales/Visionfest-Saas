module.exports = (sequelize, DataTypes) => {
  const Plano = sequelize.define(
    "Plano",
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      duracao: {
        type: DataTypes.INTEGER, // duração em meses (ex: 12)
        allowNull: false,
      },
      valorTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Valor total do plano (anual)",
      },
      valorMensal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // ✅ permitir nulo inicialmente
        comment: "Valor mensal calculado automaticamente",
      },
      renovacaoAutomatica: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      diasBloqueio: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      parcelasInativar: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "planos",
      underscored: true,
    }
  );

  Plano.associate = (models) => {
    Plano.hasMany(models.Empresa, { foreignKey: "planoId" });
  };

  return Plano;
};
