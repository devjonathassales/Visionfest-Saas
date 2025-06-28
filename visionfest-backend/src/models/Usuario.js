// models/usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define("Usuario", {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
    },
    senhaHash: {
      type: DataTypes.STRING,
      allowNull: false,
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
  });

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Empresa, { foreignKey: "empresaId" });
  };

  return Usuario;
};
