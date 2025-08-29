// src/models/Empresa.js  (BANCO DO CLIENTE)
module.exports = (sequelize, DataTypes) => {
  const Empresa = sequelize.define(
    "Empresa",
    {
      // ID implícito (Sequelize cria "id" por padrão; se não, defina aqui)

      nome: { type: DataTypes.STRING, allowNull: false },

      /**
       * A coluna física no banco do cliente CONTINUA sendo "documento".
       * Do ponto de vista de código, poderemos acessar "empresa.cpfCnpj"
       * que, por baixo, lê/escreve em "documento".
       */
      documento: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true, // (ativaremos via migration/constraint para não quebrar ambientes antigos)
      },

      // Campo virtual para compatibilidade com o painel
      cpfCnpj: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("documento");
        },
        set(val) {
          this.setDataValue("documento", val);
        },
      },

      whatsapp: DataTypes.STRING,
      telefone: DataTypes.STRING,
      email: DataTypes.STRING,
      instagram: DataTypes.STRING,
      logo: DataTypes.STRING, // nome do arquivo da logo

      // Se quiser “espelhar” os campos de endereço do painel aqui (opcional),
      // você pode manter o Endereco separado como já tem (recomendado),
      // ou adicionar campos diretos abaixo:
      // cep: DataTypes.STRING,
      // endereco: DataTypes.STRING,
      // numero: DataTypes.STRING,
      // bairro: DataTypes.STRING,
      // cidade: DataTypes.STRING,
      // uf: DataTypes.STRING,
    },
    {
      tableName: "empresas", // <<< igual ao painel
      underscored: true, // <<< snake_case no banco
      timestamps: true,
    }
  );

  Empresa.associate = (models) => {
    Empresa.hasMany(models.Endereco, {
      foreignKey: "empresaId",
      as: "enderecos",
      onDelete: "CASCADE",
      hooks: true,
    });
  };

  return Empresa;
};
