const Sequelize = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    logging: config.logging,
  }
);

// Models
const AdminUser = require('./AdminUser')(sequelize, Sequelize.DataTypes);
const Empresa = require('./Empresa')(sequelize, Sequelize.DataTypes);

// Exportar tudo
module.exports = {
  sequelize,
  Sequelize,
  AdminUser,
  Empresa,
};
