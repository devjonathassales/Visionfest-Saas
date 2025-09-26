// src/models/FaturaSaaS.js
module.exports = (sequelize, DataTypes) => {
  const FaturaSaaS = sequelize.define(
    "FaturaSaaS",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      // Dados principais
      descricao: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Assinatura do plano",
      },
      // "YYYY-MM"
      competencia: {
        type: DataTypes.STRING(7),
        allowNull: true,
      },
      vencimento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // Status e pagamento
      status: {
        type: DataTypes.ENUM("aberto", "pago", "cancelado"),
        allowNull: false,
        defaultValue: "aberto",
      },
      formaPagamento: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dataPagamento: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      valorPago: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      // Referências
      referenciaPublicContaId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "ID da ContaReceber (admin/public) que originou esta fatura",
      },
      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Escopo/relacionamentos opcionais
      empresaId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      contratoClienteId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
    },
    {
      tableName: "faturas_saas",
      underscored: true,
      timestamps: true, // createdAt/updatedAt
    }
  );

  FaturaSaaS.associate = (models) => {
    if (models.Empresa && FaturaSaaS.rawAttributes?.empresaId) {
      FaturaSaaS.belongsTo(models.Empresa, {
        as: "empresa",
        foreignKey: "empresaId",
      });
    }
    if (models.ContratoCliente && FaturaSaaS.rawAttributes?.contratoClienteId) {
      FaturaSaaS.belongsTo(models.ContratoCliente, {
        as: "contratoCliente",
        foreignKey: "contratoClienteId",
      });
    }
  };

  return FaturaSaaS;
};
