module.exports = (sequelize, DataTypes) => {
  const Endereco = sequelize.define("Endereco", {
    logradouro: { type: DataTypes.STRING, allowNull: false },
    numero: { type: DataTypes.STRING, allowNull: false },
    bairro: { type: DataTypes.STRING, allowNull: false },
    cidade: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false },
    cep: { type: DataTypes.STRING, allowNull: false },
    padrao: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  Endereco.associate = (models) => {
    Endereco.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
  };

  return Endereco;
};
