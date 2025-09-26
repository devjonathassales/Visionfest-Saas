// src/models/Endereco.js
module.exports = (sequelize, DataTypes) => {
  const Endereco = sequelize.define(
    "Endereco",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      empresaId: { type: DataTypes.INTEGER, allowNull: false },

      // usado quando espelhamos com o admin
      adminEnderecoId: { type: DataTypes.INTEGER, allowNull: true },

      logradouro: { type: DataTypes.STRING, allowNull: true },
      numero: { type: DataTypes.STRING, allowNull: true },
      bairro: { type: DataTypes.STRING, allowNull: true },
      cidade: { type: DataTypes.STRING, allowNull: true },
      estado: { type: DataTypes.STRING, allowNull: true }, // (UF)
      cep: { type: DataTypes.STRING, allowNull: true },
      padrao: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "enderecos",
      freezeTableName: true,
      underscored: true,
    }
  );

  Endereco.associate = (models) => {
    // ✅ apenas o belongsTo aqui (NÃO registre hasMany aqui!)
    if (models.Empresa) {
      Endereco.belongsTo(models.Empresa, {
        as: "empresa",
        foreignKey: "empresaId",
      });
    }
  };

  return Endereco;
};
