const express = require('express');
const router = express.Router();
const centroCustoController = require('../controllers/centroCustoController');

router.get('/', centroCustoController.listar);
router.get('/tipo/custo', centroCustoController.listarCusto);
router.post('/', centroCustoController.criar);
router.put('/:id', centroCustoController.atualizar);
router.delete('/:id', centroCustoController.deletar);

module.exports = router;