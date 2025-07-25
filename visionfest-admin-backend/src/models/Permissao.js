module.exports = (sequelize, DataTypes) => {
  const Permissao = sequelize.define(
    "Permissao",
    {
      chave: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      rotulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "permissoes",
      underscored: true,
    }
  );

  Permissao.associate = (models) => {
    Permissao.belongsToMany(models.AdminUser, {
      through: "admin_user_permissoes",
      as: "usuarios", // 👈 alias para o lado inverso
      foreignKey: "permissao_id",
      otherKey: "admin_user_id",
    });
  };

  return Permissao;
};
