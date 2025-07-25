const { AdminUser, Permissao } = require("../models");
const bcrypt = require("bcrypt");

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await AdminUser.findAll({
      include: [{ model: Permissao, as: "permissoes" }],
      attributes: { exclude: ["senha"] }, // nunca retornar a senha
    });
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
};

exports.criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, ativo, permissoes } = req.body;

    const hash = await bcrypt.hash(senha, 10);

    const usuario = await AdminUser.create({
      nome,
      email,
      senha: hash,
      ativo,
    });

    if (permissoes && permissoes.length > 0) {
      const permissoesDb = await Permissao.findAll({
        where: { chave: permissoes },
      });
      await usuario.setPermissoes(permissoesDb);
    }

    res.status(201).json(usuario);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ erro: "Erro ao criar usuário" });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, ativo, permissoes } = req.body;

    const usuario = await AdminUser.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    usuario.nome = nome;
    usuario.email = email;
    usuario.ativo = ativo;

    if (senha) {
      usuario.senha = await bcrypt.hash(senha, 10);
    }

    await usuario.save();

    if (permissoes && permissoes.length > 0) {
      const permissoesDb = await Permissao.findAll({
        where: { chave: permissoes },
      });
      await usuario.setPermissoes(permissoesDb);
    } else {
      await usuario.setPermissoes([]);
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ erro: "Erro ao atualizar usuário" });
  }
};

exports.excluirUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await AdminUser.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    await usuario.destroy();
    res.json({ mensagem: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ erro: "Erro ao excluir usuário" });
  }
};

exports.inativarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await AdminUser.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    usuario.ativo = false;
    await usuario.save();

    res.json({ mensagem: "Usuário inativado com sucesso" });
  } catch (error) {
    console.error("Erro ao inativar usuário:", error);
    res.status(500).json({ erro: "Erro ao inativar usuário" });
  }
};
