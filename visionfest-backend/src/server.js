require("dotenv").config();
const app = require("./app");
const { Sequelize } = require("sequelize");

const PORT = process.env.PORT || 5000;

// Conexão base (apenas para manter a conexão ativa e gerenciar schemas)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

async function start() {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    // Testa conexão
    await sequelize.authenticate();
    console.log("Banco global conectado com sucesso");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar banco:", error);
    process.exit(1);
  }
}

start();
