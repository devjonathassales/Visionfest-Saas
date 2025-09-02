const express = require("express");
const router = express.Router();
const authCliente = require("../middlewares/authCliente");
const contratoController = require("../controllers/contratoController");

// O app monta assim: app.use("/api/contratos", contratoRoutes)
// Portanto, aqui NÃO repita "/contratos"
router.get("/", authCliente, contratoController.listar);
router.get("/agenda", authCliente, contratoController.listarAgenda);
router.get("/:id", authCliente, contratoController.buscarPorId);
router.post("/", authCliente, contratoController.criar);
router.put("/:id", authCliente, contratoController.atualizar);
router.delete("/:id", authCliente, contratoController.excluir);

module.exports = router;
