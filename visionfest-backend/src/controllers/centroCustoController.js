const CentroCusto = require('../models/CentroCusto');

exports.listar = async (req, res) => {
  try {
    const centros = await CentroCusto.findAll();
    res.json(centros);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar centros de custo' });
  }
};

exports.criar = async (req, res) => {
  const { descricao, tipo } = req.body;
  if (!descricao || !tipo) {
    return res.status(400).json({ error: 'Descrição e tipo são obrigatórios' });
  }

  try {
    const novoCentro = await CentroCusto.create({ descricao, tipo });
    res.status(201).json(novoCentro);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar centro de custo' });
  }
};

exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { descricao, tipo } = req.body;

  try {
    const centro = await CentroCusto.findByPk(id);
    if (!centro) return res.status(404).json({ error: 'Centro não encontrado' });

    centro.descricao = descricao ?? centro.descricao;
    centro.tipo = tipo ?? centro.tipo;
    await centro.save();

    res.json(centro);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar centro de custo' });
  }
};

exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const centro = await CentroCusto.findByPk(id);
    if (!centro) return res.status(404).json({ error: 'Centro não encontrado' });

    await centro.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar centro de custo' });
  }
};