module.exports = (sequelize, DataTypes) => {
  const Fornecedor = sequelize.define(
    "Fornecedor",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: DataTypes.STRING,
      cpfCnpj: { type: DataTypes.STRING, unique: true },
      endereco: DataTypes.STRING,
      whatsapp: DataTypes.STRING,
      email: DataTypes.STRING,
    },
    {
      tableName: "fornecedores",
      timestamps: true,
    }
  );

  Fornecedor.associate = (models) => {
    Fornecedor.hasMany(models.ContaPagar, {
      foreignKey: "fornecedorId",
      as: "contasPagar",
    });
  };

  return Fornecedor;
};
