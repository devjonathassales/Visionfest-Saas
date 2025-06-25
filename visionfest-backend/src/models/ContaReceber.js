module.exports = (sequelize, DataTypes) => {
  const ContaReceber = sequelize.define('ContaReceber', {
    descricao: {
      type: DataTypes.STRING,
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    desconto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    tipoDesconto: {
      type: DataTypes.ENUM('valor', 'percentual'),
      defaultValue: 'valor'
    },
    valorTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    vencimento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dataRecebimento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('aberto', 'pago'),
      defaultValue: 'aberto'
    },
    formaPagamento: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tipoCredito: {
      type: DataTypes.ENUM('avista', 'parcelado'),
      allowNull: true
    },
    parcelas: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    valorRecebido: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'contas_receber',
    underscored: true
  });

  ContaReceber.associate = models => {
    ContaReceber.belongsTo(models.CentroCusto, {
      as: 'centroReceita',
      foreignKey: { name: 'centroCustoId', allowNull: false }
    });

    ContaReceber.belongsTo(models.ContaBancaria, {
      as: 'contaBancaria',
      foreignKey: { name: 'contaBancariaId', allowNull: true }
    });
  };

  return ContaReceber;
};
