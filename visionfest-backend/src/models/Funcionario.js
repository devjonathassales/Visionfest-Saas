const { DataTypes, Model } = require("sequelize");
const sequelize = require("./index");

const Funcionario = sequelize.define('Funcionario', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rg: DataTypes.STRING,
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  dataNascimento: DataTypes.DATEONLY,
  estadoCivil: DataTypes.STRING,
  filhos: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  filhosQtd: DataTypes.INTEGER,
  whatsapp: DataTypes.STRING,
  email: DataTypes.STRING,
  cep: DataTypes.STRING,
  logradouro: DataTypes.STRING,
  numero: DataTypes.STRING,
  bairro: DataTypes.STRING,
  cidade: DataTypes.STRING,
  estado: DataTypes.STRING,
  banco: DataTypes.STRING,
  agencia: DataTypes.STRING,
  conta: DataTypes.STRING,
  pixTipo: {
    type: DataTypes.ENUM('cpf', 'email', 'telefone', 'aleatoria'),
    allowNull: true,
  },
  pixChave: DataTypes.STRING,
  salario: DataTypes.STRING,
  funcao: DataTypes.STRING,
  dataAdmissao: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dataDemissao: DataTypes.DATEONLY,
}, {
  timestamps: true,
});

module.exports = Funcionario;
