const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const empresaRoutes = require("./routes/empresaRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const centroCustoRoutes = require("./routes/centroCustoRoutes");
const contaBancariaRoutes = require("./routes/contaBancariaRoutes");
const contasPagarRoutes = require("./routes/contasPagarRoutes");
const contaReceberRoutes = require("./routes/contaReceberRoutes");
const caixaRoutes = require("./routes/caixaRoutes");
const planoRoutes = require("./routes/planoRoutes");
const permissaoRoutes = require("./routes/permissaoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");

// 🔹 NOVO: rotas do suporte (painel administrativo)
const suporteAdminRoutes = require("./routes/suporteAdminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// (opcional, mas útil) servir uploads se já usa upload de arquivos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rotas existentes
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/centros-custo", centroCustoRoutes);
app.use("/api/contas-bancarias", contaBancariaRoutes);
app.use("/api/contas-pagar", contasPagarRoutes);
app.use("/api/contas-receber", contaReceberRoutes);
app.use("/api/caixa", caixaRoutes);
app.use("/api/planos", planoRoutes);
app.use("/api/permissoes", permissaoRoutes);
app.use("/api/usuarios", usuarioRoutes);

// 🔹 NOVO: monta as rotas do suporte admin em /api/admin/suporte
app.use("/api/admin/suporte", suporteAdminRoutes);

module.exports = app;
