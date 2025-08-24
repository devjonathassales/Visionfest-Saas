const { Sequelize } = require('sequelize');

function getAdminSequelize() {
  return new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    schema: 'public', // sempre admin
    logging: false,
  });
}

function getClienteSequelize(schema) {
  return new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    schema,
    dialectOptions: {
      options: `-c search_path=${schema}`,
    },
    logging: false,
  });
}

module.exports = { getAdminSequelize, getClienteSequelize };
