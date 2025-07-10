const { Plano, Empresa } = require("../models");

exports.listarPlanos = async (_req, res) => {
  try {
    const planos = await Plano.findAll({
      attributes: ["id", "nome", "duracao", "valor"], // Retorna só o necessário
    });
    res.json(planos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao listar planos" });
  }
};

exports.criarPlano = async (req, res) => {
  try {
    const plano = await Plano.create(req.body);
    res.status(201).json(plano);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao criar plano" });
  }
};

exports.editarPlano = async (req, res) => {
  try {
    const { id } = req.params;
    const plano = await Plano.findByPk(id);

    if (!plano) {
      return res.status(404).json({ mensagem: "Plano não encontrado" });
    }

    await plano.update(req.body);
    res.json(plano);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao atualizar plano" });
  }
};

exports.excluirPlano = async (req, res) => {
  try {
    const { id } = req.params;
    const plano = await Plano.findByPk(id);

    if (!plano) {
      return res.status(404).json({ mensagem: "Plano não encontrado" });
    }

    const empresasVinculadas = await Empresa.count({ where: { plano: plano.nome } });
    if (empresasVinculadas > 0) {
      return res.status(400).json({
        mensagem: "Não é possível excluir o plano. Ele está vinculado a uma ou mais empresas.",
      });
    }

    await plano.destroy();
    res.json({ mensagem: "Plano excluído com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao excluir plano" });
  }
};
