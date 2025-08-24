// models/adminUser.js
module.exports = (sequelize, DataTypes) => {
  const AdminUser = sequelize.define(
    "AdminUser",
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      senha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("superadmin", "admin", "funcionario"),
        allowNull: false,
        defaultValue: "funcionario",
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "admin_users",
      underscored: true,
      defaultScope: {
        attributes: { exclude: ["senha", "refreshToken"] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ["senha", "refreshToken"] },
        },
      },
    }
  );

  AdminUser.associate = (models) => {
    AdminUser.belongsToMany(models.Permissao, {
      through: "admin_user_permissoes",
      as: "permissoes",
      foreignKey: "admin_user_id",
      otherKey: "permissao_id",
    });
  };

  return AdminUser;
};
