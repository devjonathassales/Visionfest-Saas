module.exports = (sequelize, DataTypes) => {
  const ContaBancaria = sequelize.define("ContaBancaria", {
    banco: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    agencia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    chavePix: {
      type: DataTypes.JSONB, // para armazenar { tipo: 'CPF', valor: '...' }
      allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
  }, {
    tableName: "contas_bancarias",
    underscored: true,
  });

  return ContaBancaria;
};
