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

  return Fornecedor;
};
