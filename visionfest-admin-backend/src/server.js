// src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { sequelize } = require('./models'); // Ajuste o caminho conforme seu projeto
const authRoutes = require('./routes/authRoutes'); // Confirme se o arquivo está em src/routes/authRoutes.js
const empresaRoutes = require('./routes/empresaRoutes'); // idem para empresaRoutes
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", dashboardRoutes);

// Sincronizar banco e iniciar servidor
const PORT = process.env.PORT || 5001;

sequelize.sync({ alter: true }) // cria ou atualiza as tabelas
  .then(() => {
    console.log('✅ Tabelas sincronizadas');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao sincronizar tabelas', err);
  });

module.exports = app;
