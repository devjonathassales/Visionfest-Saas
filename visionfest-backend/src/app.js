const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const clienteRoutes = require("./routes/clienteRoutes");
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const produtosRoutes = require('./routes/produtoRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const centroCustoRoutes = require('./routes/centroCustoRoutes');
const cartoesCreditoRoutes = require('./routes/cartoesCreditoRoutes');
const contaBancariaRoutes = require('./routes/contaBancariaRoutes');
const contasPagarRoutes = require('./routes/contasPagarRoutes');
const contasReceberRoutes = require('./routes/contasReceberRoutes');
const caixaRoutes = require("./routes/caixaRoutes");
const empresaRoutes = require("./routes/empresaRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // para multer funcionar com form-data

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use("/api/clientes", clienteRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api', estoqueRoutes);
app.use('/api/centrocusto', centroCustoRoutes);
app.use('/api/cartoes-credito', cartoesCreditoRoutes);
app.use('/api/contas-bancarias', contaBancariaRoutes);
app.use('/api/contas-pagar', contasPagarRoutes);
app.use('/api/contas-receber', contasReceberRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/empresa', empresaRoutes);

module.exports = app;
