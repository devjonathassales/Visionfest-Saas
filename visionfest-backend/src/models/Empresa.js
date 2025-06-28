module.exports = (sequelize, DataTypes) => {
  const Empresa = sequelize.define("Empresa", {
    nome: { type: DataTypes.STRING, allowNull: false },
    documento: { type: DataTypes.STRING, allowNull: false },
    whatsapp: DataTypes.STRING,
    telefone: DataTypes.STRING,
    email: DataTypes.STRING,
    instagram: DataTypes.STRING,
    logo: DataTypes.STRING, // nome do arquivo da logo
  });

  Empresa.associate = (models) => {
    Empresa.hasMany(models.Endereco, {
      foreignKey: "empresaId",
      as: "enderecos",
      onDelete: "CASCADE", // se a empresa for deletada, remove os endereços
      hooks: true,
    });
  };

  return Empresa;
};
