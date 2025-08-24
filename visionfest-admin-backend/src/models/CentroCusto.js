module.exports = (sequelize, DataTypes) => {
  const CentroCusto = sequelize.define(
    "CentroCusto",
    {
      descricao: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      tipo: {
        type: DataTypes.ENUM("Custo", "Receita", "Ambos"),
        defaultValue: "Custo",
        allowNull: false,
      },
    },
    {
      tableName: "centros_custo",
      underscored: true,
      timestamps: true, // mantém createdAt e updatedAt
    }
  );

  return CentroCusto;
};
