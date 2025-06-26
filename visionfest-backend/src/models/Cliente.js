module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    "Cliente",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nome: DataTypes.STRING,
      cpf: { type: DataTypes.STRING(14), unique: true },
      whatsapp: DataTypes.STRING,
      celular: DataTypes.STRING,
      dataNascimento: { type: DataTypes.DATEONLY, field: "data_nascimento" },
      email: { type: DataTypes.STRING, unique: true },
      instagram: DataTypes.STRING,
      cep: DataTypes.STRING,
      logradouro: DataTypes.STRING,
      numero: DataTypes.STRING,
      complemento: DataTypes.STRING,
      bairro: DataTypes.STRING,
      cidade: DataTypes.STRING,
      estado: DataTypes.STRING(2),
    },
    {
      tableName: "clientes",
      underscored: true,
      timestamps: true,
    }
  );

    Cliente.associate = (models) => {
    Cliente.hasMany(models.ContaReceber, {
      foreignKey: 'clienteId',
      as: 'contasReceber',
    });
  };

  return Cliente;
};
