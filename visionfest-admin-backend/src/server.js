require("dotenv").config();
const app = require("./app");
const db = require("./models");

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    await db.sequelize.authenticate();
    console.log("Banco conectado com sucesso");

    // Em desenvolvimento aplica alterações automaticamente
    if (process.env.NODE_ENV !== "production") {
      await db.sequelize.sync({ alter: true });
      console.log("Banco sincronizado (alterações aplicadas)");
    }

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar banco:", error);
    process.exit(1);
  }
}

start();
