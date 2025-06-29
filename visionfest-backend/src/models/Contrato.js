module.exports = (sequelize, DataTypes) => {
  const Contrato = sequelize.define("Contrato", {
    clienteId: {
      type: DataTypes.UUID, // Alterado para UUID
      allowNull: false,
    },
    dataEvento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    horarioInicio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    horarioTermino: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    localEvento: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nomeBuffet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    temaFesta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    valorTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    descontoValor: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    descontoPercentual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    valorEntrada: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    valorRestante: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    parcelasRestante: {
      type: DataTypes.JSON, // array com parcelas {valor, vencimento}
      allowNull: true,
    },
    dataContrato: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    statusPagamento: {
      type: DataTypes.ENUM("Aberto", "Parcialmente Pago", "Totalmente Pago"),
      defaultValue: "Aberto",
    },
  });

  Contrato.associate = (models) => {
    Contrato.belongsTo(models.Cliente, { foreignKey: "clienteId" });
    Contrato.belongsToMany(models.Produto, {
      through: models.ContratoProduto,
      foreignKey: "contratoId",
      otherKey: "produtoId",
    });
    Contrato.hasMany(models.ContaReceber, {
      foreignKey: "contratoId",
      as: "contasReceber",
    });
  };

  return Contrato;
};
