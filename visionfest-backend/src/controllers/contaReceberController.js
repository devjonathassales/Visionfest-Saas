const { ContaReceber, CentroCusto, ContaBancaria } = require('../models');

exports.listar = async (req, res) => {
  try {
    const contas = await ContaReceber.findAll({
      include: [
        { model: CentroCusto, as: 'centroReceita', attributes: ['descricao'] },
        { model: ContaBancaria, as: 'contaBancaria', attributes: ['banco','agencia','conta','id'] },
      ],
      order: [['vencimento','ASC']],
    });
    res.json(contas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar contas a receber.' });
  }
};

exports.obterPorId = async (req, res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id, {
      include: [
        { model: CentroCusto, as: 'centroReceita', attributes: ['descricao'] },
        { model: ContaBancaria, as: 'contaBancaria', attributes: ['banco','agencia','conta','id'] },
      ],
    });
    if (!conta) return res.status(404).json({error: 'Conta não encontrada.'});
    res.json(conta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar conta.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const nova = await ContaReceber.create(req.body);
    res.status(201).json(nova);
  } catch(e) { console.error(e); res.status(500).json({error:'Erro ao criar.'}); }
};

exports.atualizar = async (req,res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({error:'Conta não encontrada.'});
    await conta.update(req.body);
    res.json(conta);
  } catch(e){console.error(e);res.status(500).json({error:'Erro ao atualizar.'});}
};

exports.receber = async (req, res) => {
  try {
    const { dataRecebimento, formaPagamento, contaBancariaId, tipoCredito, parcelas, valorRecebido } = req.body;
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({error:'Conta não encontrada.'});
    await conta.update({
      dataRecebimento,
      formaPagamento,
      contaBancariaId: contaBancariaId || null,
      valorRecebido,
      tipoCredito: tipoCredito || null,
      parcelas: parcelas || null,
      status: 'pago',
    });
    res.json(conta);
  } catch(e){console.error(e);res.status(500).json({error:'Erro ao receber conta.'});}
};

exports.estornar = async (req,res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({error:'Conta não encontrada.'});
    if (conta.status !== 'pago') return res.status(400).json({error:'Só é possível estornar paga.'});
    await conta.update({
      dataRecebimento: null,
      formaPagamento: null,
      contaBancariaId: null,
      valorRecebido: null,
      tipoCredito: null,
      parcelas: null,
      status: 'aberto',
    });
    res.json({message:'Estornado com sucesso.'});
  } catch(e){console.error(e);res.status(500).json({error:'Erro ao estornar conta.'});}
};

exports.excluir = async (req,res) => {
  try {
    const conta = await ContaReceber.findByPk(req.params.id);
    if (!conta) return res.status(404).json({error:'Conta não encontrada.'});
    if (conta.status === 'pago') return res.status(400).json({error:'Não pode excluir paga.'});
    await conta.destroy();
    res.sendStatus(204);
  } catch(e){console.error(e);res.status(500).json({error:'Erro ao excluir.'});}
};
