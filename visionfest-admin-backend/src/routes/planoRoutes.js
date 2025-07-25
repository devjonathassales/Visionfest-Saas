const express = require("express");
const router = express.Router();
const planoController = require("../controllers/planoController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

router.use(authMiddleware);

router.get("/", verificarPermissao("gerenciarPlanos"), planoController.listarPlanos);
router.post("/", verificarPermissao("gerenciarPlanos"), planoController.criarPlano);
router.put("/:id", verificarPermissao("gerenciarPlanos"), planoController.editarPlano);
router.delete("/:id", verificarPermissao("gerenciarPlanos"), planoController.excluirPlano);

module.exports = router;
