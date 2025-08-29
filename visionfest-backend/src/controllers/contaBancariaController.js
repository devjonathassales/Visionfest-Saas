const { getDbCliente } = require("../utils/tenant");

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
    const db = getDbCliente(req.bancoCliente);
    const { ContaBancaria } = db.models;

    const contas = await ContaBancaria.findAll({
      where: { empresaId: req.empresaId },
    });
    const contasFormatadas = contas.map(formatarConta);
    res.json(contasFormatadas);
  } catch (error) {
    console.error("Erro ao listar contas bancárias:", error);
    res.status(500).json({ error: "Erro ao listar contas bancárias." });
  }
};

exports.criar = async (req, res) => {
  try {
    const db = getDbCliente(req.bancoCliente);
    const { ContaBancaria } = db.models;

    const { banco, agencia, conta, chavePix } = req.body;

    const novaConta = await ContaBancaria.create({
      banco,
      agencia,
      conta,
      chavePixTipo: chavePix?.tipo || null,
      chavePixValor: chavePix?.valor || null,
      empresaId: req.empresaId,
    });

    res.status(201).json(formatarConta(novaConta));
  } catch (error) {
    console.error("Erro ao criar conta bancária:", error);
    res.status(500).json({ error: "Erro ao criar conta bancária." });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const db = getDbCliente(req.bancoCliente);
    const { ContaBancaria } = db.models;

    const { id } = req.params;
    const contaExistente = await ContaBancaria.findOne({
      where: { id, empresaId: req.empresaId },
    });
    if (!contaExistente)
      return res.status(404).json({ error: "Conta não encontrada." });

    const { banco, agencia, conta, chavePix } = req.body;

    await contaExistente.update({
      banco,
      agencia,
      conta,
      chavePixTipo: chavePix?.tipo || null,
      chavePixValor: chavePix?.valor || null,
    });

    res.json(formatarConta(contaExistente));
  } catch (error) {
    console.error("Erro ao atualizar conta bancária:", error);
    res.status(500).json({ error: "Erro ao atualizar conta bancária." });
  }
};

exports.excluir = async (req, res) => {
  try {
    const db = getDbCliente(req.bancoCliente);
    const { ContaBancaria, Financeiro } = db.models;

    const { id } = req.params;

    const existeTitulo = await Financeiro.findOne({
      where: { contaBancariaId: id, empresaId: req.empresaId },
    });
    if (existeTitulo) {
      return res
        .status(400)
        .json({ error: "Conta vinculada a lançamentos financeiros." });
    }

    await ContaBancaria.destroy({
      where: { id, empresaId: req.empresaId },
    });
    res.sendStatus(204);
  } catch (error) {
    console.error("Erro ao excluir conta bancária:", error);
    res.status(500).json({ error: "Erro ao excluir conta bancária." });
  }
};
