const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

function criarConexaoBanco(banco) {
  return new Sequelize(banco, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  });
}

function criarBancoCliente(nomeBanco) {
  return new Promise((resolve, reject) => {
    const sequelize = new Sequelize(process.env.DB_ADMIN, process.env.DB_USER, process.env.DB_PASS, {
      host: process.env.DB_HOST,
      dialect: "postgres",
      logging: false,
    });

    sequelize.query(`CREATE DATABASE "${nomeBanco}";`)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

module.exports = { criarConexaoBanco, criarBancoCliente };
