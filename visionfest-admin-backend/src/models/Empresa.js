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
        type: DataTypes.ENUM("ativo", "bloqueado", "aguardando_pagamento"),
        defaultValue: "aguardando_pagamento",
      },
      bancoDados: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cep: DataTypes.STRING,
      endereco: DataTypes.STRING,
      numero: DataTypes.STRING, // ✅ Novo campo adicionado
      bairro: DataTypes.STRING,
      cidade: DataTypes.STRING,
      uf: DataTypes.STRING,
      whatsapp: DataTypes.STRING,
      instagram: DataTypes.STRING,
      email: DataTypes.STRING,
      planoId: {
        type: DataTypes.INTEGER,
        references: {
          model: "planos",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false,
      },
      usuarioSuperAdmin: DataTypes.STRING,
    },
    {
      tableName: "empresas",
      underscored: true,
    }
  );

  Empresa.associate = (models) => {
    Empresa.belongsTo(models.Plano, { foreignKey: "planoId" });
  };

  return Empresa;
};
