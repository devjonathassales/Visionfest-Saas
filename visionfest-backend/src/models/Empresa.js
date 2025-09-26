// src/models/Empresa.js
module.exports = (sequelize, DataTypes) => {
  const Empresa = sequelize.define(
    "Empresa",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      adminEmpresaId: { type: DataTypes.INTEGER, allowNull: true },

      nome: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },

      // alguns tenants usam "documento", outros "cpfCnpj"
      documento: { type: DataTypes.STRING, allowNull: true },
      cpfCnpj: { type: DataTypes.STRING, allowNull: true },

      whatsapp: { type: DataTypes.STRING, allowNull: true },
      telefone: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      instagram: { type: DataTypes.STRING, allowNull: true },

      dominio: { type: DataTypes.STRING, allowNull: true },
      logo: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "empresas",
      freezeTableName: true,
      underscored: true, // created_at / updated_at
    }
  );

  Empresa.associate = (models) => {
    // ✅ declare o hasMany APENAS AQUI
    if (models.Endereco) {
      Empresa.hasMany(models.Endereco, {
        as: "enderecos",
        foreignKey: "empresaId",
        onDelete: "CASCADE",
        hooks: true,
      });
    }
  };

  return Empresa;
};
