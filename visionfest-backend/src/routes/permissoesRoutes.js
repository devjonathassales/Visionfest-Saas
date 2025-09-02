const express = require("express");
const router = express.Router();

const authCliente = require("../middlewares/authCliente");
const permissaoController = require("../controllers/permissaoController");

// O app monta: app.use("/api/permissoes", permissaoRoutes)
router.get("/:id", authCliente, permissaoController.buscarPermissoes);
router.put("/:id", authCliente, permissaoController.salvarPermissoes);

module.exports = router;
