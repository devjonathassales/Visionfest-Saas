// models/usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // EXACT no banco: coluna "email"
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
        field: "email",
      },

      // EXACT no banco: coluna "senhaHash"
      senhaHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "senhaHash",
      },

      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      permissoes: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: "Usuarios", // EXACT (U maiúsculo)
      freezeTableName: true, // não pluraliza/renomeia
      underscored: false, // NÃO converter para snake_case
      timestamps: true, // ajuste para false se sua tabela não tiver timestamps
      // Se os timestamps da tabela forem snake_case, descomente:
      // createdAt: 'created_at',
      // updatedAt: 'updated_at',
    }
  );

  Usuario.associate = (models) => {
    // só faça o vínculo se houver Empresa no schema do tenant
    if (models.Empresa) {
      Usuario.belongsTo(models.Empresa, { foreignKey: "empresaId" });
    }
  };

  return Usuario;
};
