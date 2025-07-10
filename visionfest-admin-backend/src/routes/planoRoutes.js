const express = require("express");
const router = express.Router();
const planoController = require("../controllers/planoController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/", verificarToken, planoController.listarPlanos);
router.post("/", verificarToken, planoController.criarPlano);
router.put("/:id", verificarToken, planoController.editarPlano);
router.delete("/:id", verificarToken, planoController.excluirPlano);

module.exports = router;
