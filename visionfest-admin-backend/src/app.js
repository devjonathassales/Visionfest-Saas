const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require('./routes/authRoutes'); // Confirme se o arquivo está em src/routes/authRoutes.js
const empresaRoutes = require('./routes/empresaRoutes'); // idem para empresaRoutes
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const centroCustoRoutes = require("./routes/centroCustoRoutes");
const contaBancariaRoutes = require("./routes/contaBancariaRoutes");
const contasPagarRoutes = require("./routes/contasPagarRoutes");
const contaReceberRoutes = require('./routes/contaReceberRoutes');
const caixaRoutes = require('./routes/caixaRoutes');
const planoRoutes = require("./routes/planoRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/centros-custo", centroCustoRoutes)
app.use("/api/contas-bancarias", contaBancariaRoutes);
app.use("/api/contas-pagar", contasPagarRoutes);
app.use('/api/contas-receber', contaReceberRoutes);
app.use('/api/caixa', caixaRoutes);
app.use("/api/planos", planoRoutes);

module.exports = app;
