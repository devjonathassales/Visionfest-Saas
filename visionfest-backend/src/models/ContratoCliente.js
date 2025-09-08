// visionfest-backend/src/models/ContratoCliente.js
module.exports = (sequelize, DataTypes, schemaName) => {
  const ContratoCliente = sequelize.define(
    "ContratoCliente",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // vínculo com a empresa do tenant
      empresaId: { type: DataTypes.INTEGER, allowNull: false },

      // informações do plano/assinatura (SaaS)
      plano: { type: DataTypes.STRING, allowNull: false }, // ex: "Pro"
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      dataInicio: { type: DataTypes.DATE, allowNull: false },
      dataValidade: { type: DataTypes.DATE, allowNull: false },

      renovacaoAutomatica: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      status: {
        type: DataTypes.ENUM(
          "ativo",
          "inativo",
          "cancelamento_pendente",
          "trial"
        ),
        allowNull: false,
        defaultValue: "ativo",
      },

      // opcional (para regras de cancelamento na UI)
      metodoPagamento: { type: DataTypes.STRING, allowNull: true }, // "pix" | "boleto" | "cartao"
    },
    {
      tableName: "contratos_cliente", // evita conflito com "contratos"
      schema: schemaName || sequelize.options.schema,
      timestamps: true,
      underscored: true,
    }
  );

  ContratoCliente.associate = (models) => {
    if (models.Empresa) {
      ContratoCliente.belongsTo(models.Empresa, {
        foreignKey: "empresaId",
        as: "empresa",
      });
    }
  };

  return ContratoCliente;
};
