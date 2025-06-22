const db = require('../models');
const { ContaBancaria, Financeiro } = db;

function formatarConta(c) {
  return {
    id: c.id,
    banco: c.banco,
    agencia: c.agencia,
    conta: c.conta,
    chavePix: c.chavePixTipo && c.chavePixValor
      ? { tipo: c.chavePixTipo, valor: c.chavePixValor }
      : null,
  };
}

exports.listar = async (req, res) => {
  try {
    const contas = await ContaBancaria.findAll();
    const contasFormatadas = contas.map(formatarConta);
    res.json(contasFormatadas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar contas bancárias.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const { banco, agencia, conta, chavePix } = req.body;

    const novaConta = await ContaBancaria.create({
      banco,
      agencia,
      conta,
      chavePixTipo: chavePix?.tipo || null,
      chavePixValor: chavePix?.valor || null,
    });

    res.status(201).json(formatarConta(novaConta));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar conta bancária.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { banco, agencia, conta, chavePix } = req.body;

    const contaExistente = await ContaBancaria.findByPk(id);
    if (!contaExistente) return res.status(404).json({ error: 'Conta não encontrada.' });

    await contaExistente.update({
      banco,
      agencia,
      conta,
      chavePixTipo: chavePix?.tipo || null,
      chavePixValor: chavePix?.valor || null,
    });

    res.json(formatarConta(contaExistente));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar conta bancária.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;

    const existeTitulo = await Financeiro.findOne({ where: { contaBancariaId: id } });
    if (existeTitulo) {
      return res.status(400).json({ error: 'Conta vinculada a lançamentos financeiros.' });
    }

    await ContaBancaria.destroy({ where: { id } });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir conta bancária.' });
  }
};
