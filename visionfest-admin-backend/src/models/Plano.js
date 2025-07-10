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
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
