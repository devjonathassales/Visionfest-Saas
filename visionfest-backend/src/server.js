require("dotenv").config(); // Carrega variáveis do .env

const app = require("./app");
const sequelize = require("./models/index");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // Para verificar se está carregando

    await sequelize.authenticate();
    console.log("Banco conectado com sucesso");

    // Sincroniza models com banco - cuidado em produção!
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("Banco sincronizado (alterações aplicadas)");
    }

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar banco:", error);
    process.exit(1); // encerra app em caso de erro grave
  }
}

start();
