require('dotenv').config();

module.exports = {
  username: process.env.DB_USER || 'visionfest', // fallback
  password: process.env.DB_PASS || 'visionfest',         // fallback para string vazia
  database: process.env.DB_NAME || 'visionfestadmin',
  host: process.env.DB_HOST || 'localhost',
  dialect: "postgres",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  logging: false, // true para ver queries SQL
};
