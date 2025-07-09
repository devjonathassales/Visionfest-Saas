module.exports = (sequelize, DataTypes) => {
  const Empresa = sequelize.define(
    "Empresa",
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cpfCnpj: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dominio: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("ativo", "bloqueado"),
        defaultValue: "ativo",
      },
      bancoDados: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cep: DataTypes.STRING,
      endereco: DataTypes.STRING,
      bairro: DataTypes.STRING,
      cidade: DataTypes.STRING,
      uf: DataTypes.STRING,
      whatsapp: DataTypes.STRING,
      instagram: DataTypes.STRING,
      email: DataTypes.STRING,
      logoUrl: DataTypes.STRING,
      plano: DataTypes.STRING,
      usuarioSuperAdmin: DataTypes.STRING,
    },
    {
      tableName: "empresas",
      underscored: true,
    }
  );

  return Empresa;
};
