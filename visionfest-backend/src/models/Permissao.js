// src/models/Permissao.js
module.exports = (sequelize, DataTypes) => {
  const Permissao = sequelize.define(
    "Permissao",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      modulo: { type: DataTypes.STRING, allowNull: false },
      visualizar: { type: DataTypes.BOOLEAN, defaultValue: false },
      criarEditar: { type: DataTypes.BOOLEAN, defaultValue: false },
      excluir: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "Permissoes",
      freezeTableName: true,
      underscored: false,
      timestamps: true,
    }
  );

  Permissao.associate = (models) => {
    if (models.Usuario) {
      Permissao.belongsTo(models.Usuario, {
        as: "usuario",
        foreignKey: "usuarioId",
      });
    }
  };

  return Permissao;
};
