// models/Contrato.js
module.exports = (sequelize, DataTypes) => {
  const Contrato = sequelize.define(
    "Contrato",
    {
      clienteId: {
        field: "cliente_id",
        type: DataTypes.UUID, // mantém UUID se o banco usa UUID
        allowNull: false,
      },
      dataEvento: {
        field: "data_evento",
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      horarioInicio: {
        field: "horario_inicio",
        type: DataTypes.STRING,
        allowNull: false,
      },
      horarioTermino: {
        field: "horario_termino",
        type: DataTypes.STRING,
        allowNull: true,
      },
      localEvento: {
        field: "local_evento",
        type: DataTypes.STRING,
        allowNull: true,
      },
      nomeBuffet: {
        field: "nome_buffet",
        type: DataTypes.STRING,
        allowNull: false,
      },
      temaFesta: {
        field: "tema_festa",
        type: DataTypes.STRING,
        allowNull: true,
      },
      valorTotal: {
        field: "valor_total",
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      descontoValor: {
        field: "desconto_valor",
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      descontoPercentual: {
        field: "desconto_percentual",
        type: DataTypes.DECIMAL(5, 2), // ajustado para percentual (0-100)
        defaultValue: 0,
      },
      valorEntrada: {
        field: "valor_entrada",
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      valorRestante: {
        field: "valor_restante",
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      dataContrato: {
        field: "data_contrato",
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      statusPagamento: {
        field: "status_pagamento",
        type: DataTypes.ENUM("Aberto", "Parcialmente Pago", "Totalmente Pago"),
        defaultValue: "Aberto",
      },
      parcelasRestante: {
        field: "parcelas_restante",
        type: DataTypes.JSONB, // trocado para armazenar array de parcelas
        defaultValue: [],
      },
    },
    {
      tableName: "contratos",
      underscored: true,
    }
  );

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
