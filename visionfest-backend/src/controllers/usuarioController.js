const { Usuario } = require("../models");
const bcrypt = require("bcrypt");

module.exports = {
  async criar(req, res) {
    try {
      const { nome, email, senha, confirmarSenha } = req.body;

      if (!nome || !email || !senha || !confirmarSenha) {
        return res.status(400).json({ error: "Campos obrigatórios faltando." });
      }
      if (senha !== confirmarSenha) {
        return res.status(400).json({ error: "Senhas não coincidem." });
      }
      if (senha.length < 6) {
        return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres." });
      }

      const existente = await Usuario.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({ error: "Email já cadastrado." });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const usuario = await Usuario.create({ nome, email, senhaHash, ativo: true });
      const { senhaHash: _, ...rest } = usuario.toJSON();

      res.status(201).json(rest);
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async listar(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ["id", "nome", "email", "ativo", "createdAt"],
      });
      res.json(usuarios);
    } catch (err) {
      console.error("Erro ao listar usuários:", err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, senha, confirmarSenha } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      if (senha || confirmarSenha) {
        if (senha !== confirmarSenha) {
          return res.status(400).json({ error: "Senhas não coincidem." });
        }
        if (senha.length < 6) {
          return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres." });
        }
        usuario.senhaHash = await bcrypt.hash(senha, 10);
      }

      usuario.nome = nome;
      usuario.email = email;
      await usuario.save();

      const { senhaHash: _, ...rest } = usuario.toJSON();
      res.json(rest);
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async toggleAtivo(req, res) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      usuario.ativo = ativo;
      await usuario.save();

      const { senhaHash: _, ...rest } = usuario.toJSON();
      res.json(rest);
    } catch (err) {
      console.error("Erro ao alterar ativo:", err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      await usuario.destroy();
      res.json({ message: "Usuário excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
