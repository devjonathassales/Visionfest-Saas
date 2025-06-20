const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartoesCreditoController');

router.get('/', controller.listar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

module.exports = router;
