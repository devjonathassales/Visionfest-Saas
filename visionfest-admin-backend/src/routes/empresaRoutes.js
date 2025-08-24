const express = require("express");
const router = express.Router();
const empresaController = require("../controllers/empresaController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificarPermissao = require("../middlewares/verificarPermissao");

// ✅ Rota PÚBLICA (Wizard)
router.post("/wizard", empresaController.criarEmpresaViaWizard);

// Protege todas as rotas abaixo
router.use(authMiddleware);

// CRUD de empresa
router.post("/", verificarPermissao("editarEmpresas"), empresaController.criarEmpresa);
router.get("/", verificarPermissao("visualizarEmpresas"), empresaController.listarEmpresas);
router.patch("/:id/ativar", verificarPermissao("editarEmpresas"), empresaController.ativarEmpresa);
router.patch("/:id/bloquear", verificarPermissao("editarEmpresas"), empresaController.bloquearDesbloquear);
router.patch("/:id/upgrade", verificarPermissao("editarEmpresas"), empresaController.upgradePlanoEmpresa);
router.put("/:id", verificarPermissao("editarEmpresas"), empresaController.editarEmpresa);
router.delete("/:id", verificarPermissao("editarEmpresas"), empresaController.excluirEmpresa);

const contaReceberController = require("../controllers/contaReceberController");

router.get(
  "/:id/contas-receber",
  verificarPermissao("visualizarEmpresas"), // ou outra permissão, se preferir
  contaReceberController.listarPorEmpresa
);


module.exports = router;
