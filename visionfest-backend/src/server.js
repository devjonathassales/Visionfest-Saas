require("dotenv").config();
const app = require("./app");
const { Sequelize } = require("sequelize");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1"; // <— força IPv4 local

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

async function start() {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    await sequelize.authenticate();
    console.log("Banco global conectado com sucesso");

    app.listen(PORT, HOST, () => {
      console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar banco:", error);
    process.exit(1);
  }
}
start();
