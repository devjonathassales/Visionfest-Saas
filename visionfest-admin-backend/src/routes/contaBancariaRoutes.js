const express = require("express");
const router = express.Router();
const contaBancariaController = require("../controllers/contaBancariaController");

router.get("/", contaBancariaController.listar);
router.post("/", contaBancariaController.criar);
router.put("/:id", contaBancariaController.atualizar);
router.delete("/:id", contaBancariaController.excluir);

module.exports = router;
