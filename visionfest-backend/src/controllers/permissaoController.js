const { Permissao } = require("../models");

module.exports = {
  async buscarPermissoes(req, res) {
    try {
      const permissoes = await Permissao.findAll({
        where: { usuarioId: req.params.id },
      });

      const formatadas = {};
      permissoes.forEach((p) => {
        formatadas[p.modulo] = {
          visualizar: p.visualizar,
          criarEditar: p.criarEditar,
          excluir: p.excluir,
        };
      });

      res.json({ permissoes: formatadas });
    } catch (err) {
      console.error("Erro ao buscar permissões:", err);
      res.status(500).json({ error: "Erro ao buscar permissões." });
    }
  },

  async salvarPermissoes(req, res) {
    try {
      const usuarioId = req.params.id;
      const permissoes = req.body.permissoes;

      // Remove permissões antigas
      await Permissao.destroy({ where: { usuarioId } });

      // Insere novas permissões
      const dados = Object.entries(permissoes).map(([modulo, p]) => ({
        usuarioId,
        modulo,
        visualizar: !!p.visualizar,
        criarEditar: !!p.criarEditar,
        excluir: !!p.excluir,
      }));
      await Permissao.bulkCreate(dados);

      res.json({ message: "Permissões salvas com sucesso." });
    } catch (err) {
      console.error("Erro ao salvar permissões:", err);
      res.status(500).json({ error: "Erro ao salvar permissões." });
    }
  },
};
