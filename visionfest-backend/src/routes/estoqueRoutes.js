const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');

router.get('/estoque', estoqueController.listarEstoque);
router.post('/estoque/movimentar', estoqueController.registrarMovimentacao);

module.exports = router;
