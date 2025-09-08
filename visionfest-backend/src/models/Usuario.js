// src/models/Usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    "Usuario",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      nome: { type: DataTypes.STRING, allowNull: false },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },

      // No tenant a senha fica em 'senhaHash'
      senhaHash: { type: DataTypes.STRING, allowNull: false },

      ativo: { type: DataTypes.BOOLEAN, defaultValue: true },

      // Permissões agregadas (opcional)
      permissoes: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },

      // Extras que já apareceram na query
      role: { type: DataTypes.STRING, allowNull: true },
      perfil: { type: DataTypes.STRING, allowNull: true },

      empresaId: { type: DataTypes.INTEGER, allowNull: true },

      // para refresh de sessão (se existir na tabela)
      refreshToken: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "Usuarios", // 👈 casa com a tabela existente
      freezeTableName: true, // não pluraliza/renomeia
      underscored: false,
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ["senhaHash", "refreshToken"] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ["senhaHash"] },
        },
      },
    }
  );

  Usuario.associate = (models) => {
    if (models.Empresa) {
      Usuario.belongsTo(models.Empresa, { foreignKey: "empresaId" });
    }
    if (models.Permissao) {
      // Use alias DIFERENTE de 'permissoes' (para não colidir com o campo JSONB)
      Usuario.hasMany(models.Permissao, {
        as: "permissoesAssoc",
        foreignKey: "usuarioId",
      });
    }
  };

  return Usuario;
};
