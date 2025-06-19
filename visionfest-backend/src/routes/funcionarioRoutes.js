const express = require('express');
const router = express.Router();
const FuncionarioController = require('../controllers/funcionarioController');

router.get('/', FuncionarioController.listar);
router.get('/:id', FuncionarioController.buscarPorId);
router.post('/', FuncionarioController.criar);
router.put('/:id', FuncionarioController.atualizar);
router.delete('/:id', FuncionarioController.excluir);

module.exports = router;
