module.exports = (sequelize, DataTypes) => {
  const Permissao = sequelize.define("Permissao", {
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    modulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    visualizar: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    criarEditar: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    excluir: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  Permissao.associate = (models) => {
    Permissao.belongsTo(models.Usuario, {
      foreignKey: "usuarioId",
      as: "usuario",
    });
  };

  return Permissao;
};
