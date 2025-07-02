module.exports = (sequelize, DataTypes) => {
  const CentroCusto = sequelize.define(
    "CentroCusto",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      descricao: { type: DataTypes.STRING, allowNull: false },
      tipo: {
        type: DataTypes.ENUM("Custo", "Receita", "Ambos"),
        allowNull: false,
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "centros_custo",
      timestamps: false,
    }
  );

  CentroCusto.associate = (models) => {
    CentroCusto.hasMany(models.ContaPagar, {
      foreignKey: "centroCustoId",
      as: "contasPagar",
    });
  };

  return CentroCusto;
};
