const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const perfilCtrl = require("../controllers/perfilClienteController");

router.use(authCliente);
router.get("/empresa/perfil", perfilCtrl.obter);

module.exports = router;
