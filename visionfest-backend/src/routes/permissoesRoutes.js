const express = require("express");
const router = express.Router();
const permissaoController = require("../controllers/permissaoController");

router.get("/:id", permissaoController.buscarPermissoes);
router.put("/:id", permissaoController.salvarPermissoes);

module.exports = router;
