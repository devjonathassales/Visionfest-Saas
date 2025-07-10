module.exports = (sequelize, DataTypes) => {
  const AdminUser = sequelize.define("AdminUser", {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
  }, {
    tableName: "admin_users",
    underscored: true,
  });

  // Se precisar de relacionamentos no futuro
  AdminUser.associate = (models) => {
    // Exemplo:
    // AdminUser.hasMany(models.Empresa, { foreignKey: "adminUserId" });
  };

  return AdminUser;
};
