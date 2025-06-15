const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Rotas
const userRoutes = require("./routes/usuarios");
app.use("/api/usuarios", userRoutes);

module.exports = app;
