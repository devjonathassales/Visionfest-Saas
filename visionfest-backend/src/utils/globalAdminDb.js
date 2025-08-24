const { Sequelize } = require("sequelize");
require("dotenv").config();

const globalAdminDb = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  define: {
    schema: "cliente_visionware", // 👈 Importante: schema fixo do banco admin
  },
});

module.exports = globalAdminDb;
