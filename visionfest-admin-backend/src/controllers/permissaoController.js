const { Permissao } = require("../models");

async function listarPermissoes(req, res) {
  try {
    const permissoes = await Permissao.findAll({
      attributes: ["id", "chave", "rotulo"],
      order: [["rotulo", "ASC"]],
    });
    res.json(permissoes);
  } catch (error) {
    console.error("Erro ao listar permissões:", error);
    res.status(500).json({ erro: "Erro ao listar permissões" });
  }
}

module.exports = { listarPermissoes }; // ✅
