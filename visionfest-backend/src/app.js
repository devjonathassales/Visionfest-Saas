const express = require("express");
const cors = require("cors");
require("dotenv").config();

const clienteRoutes = require("./routes/clienteRoutes");
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const produtosRoutes = require('./routes/produtoRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const centroCustoRoutes = require('./routes/centroCustoRoutes');
const cartoesCreditoRoutes = require('./routes/cartoesCreditoRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/clientes", clienteRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api', estoqueRoutes);
app.use('/api/centrocusto', centroCustoRoutes);
app.use('/api/cartoes-credito', cartoesCreditoRoutes);


module.exports = app;
