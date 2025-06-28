const { Permissao } = require("../models");

exports.buscarPermissoes = async (req, res) => {
  try {
    const permissoes = await Permissao.findAll({
      where: { usuarioId: req.params.id },
    });

    const permissoesFormatadas = {};
    permissoes.forEach((p) => {
      permissoesFormatadas[p.modulo] = {
        visualizar: p.visualizar,
        criarEditar: p.criarEditar,
        excluir: p.excluir,
      };
    });

    res.json({ permissoes: permissoesFormatadas });
  } catch (error) {
    console.error("Erro ao buscar permissões:", error);
    res.status(500).json({ error: "Erro ao buscar permissões." });
  }
};

exports.salvarPermissoes = async (req, res) => {
  const usuarioId = req.params.id;
  const permissoes = req.body.permissoes;

  try {
    // Remove permissões antigas
    await Permissao.destroy({ where: { usuarioId } });

    // Formata para bulkCreate
    const permissoesFormatadas = Object.entries(permissoes).map(
      ([modulo, valores]) => ({
        usuarioId,
        modulo,
        visualizar: !!valores.visualizar,
        criarEditar: !!valores.criarEditar,
        excluir: !!valores.excluir,
      })
    );

    // Salva no banco
    await Permissao.bulkCreate(permissoesFormatadas);

    res.json({ message: "Permissões salvas com sucesso." });
  } catch (error) {
    console.error("Erro ao salvar permissões:", error);
    res.status(500).json({ error: "Erro ao salvar permissões." });
  }
};
