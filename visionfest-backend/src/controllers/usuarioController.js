// src/controllers/usuarioController.js
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

// Obtém o DB do tenant (do middleware ou resolvendo pela req)
async function getDbFromReq(req) {
  if (req.tenantDb) return req.tenantDb;
  const empresa = await resolveEmpresaFromReq(req);
  if (!empresa) throw new Error("empresa_nao_identificada");
  return getTenantDb(empresa.bancoDados);
}

// Tenta descobrir empresaId de múltiplas fontes
async function getDbAndEmpresaId(req) {
  const db = await getDbFromReq(req);
  let empresaId = req.empresaId ?? null;

  if (empresaId == null) {
    try {
      const empresa = await resolveEmpresaFromReq(req);
      if (empresa?.id != null) empresaId = empresa.id;
    } catch (_) {}
  }
  return { db, empresaId };
}

// Busca modelo em db.models[Name] ou db[Name]
const getModel = (db, name) => db?.models?.[name] ?? db?.[name];
const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];

function sanitize(u) {
  if (!u) return u;
  const plain = u.toJSON ? u.toJSON() : u;
  const { senhaHash, ...rest } = plain;
  return rest;
}

module.exports = {
  async criar(req, res) {
    try {
      const { db, empresaId } = await getDbAndEmpresaId(req);
      const Usuario = getModel(db, "Usuario");
      if (!Usuario) {
        console.error("[usuarios] Modelo 'Usuario' não encontrado no tenant.");
        return res
          .status(500)
          .json({ error: "Modelo Usuario não registrado para este tenant." });
      }

      let { nome, email, senha, confirmarSenha } = req.body || {};
      if (!nome || !email || !senha || !confirmarSenha) {
        return res.status(400).json({ error: "Campos obrigatórios faltando." });
      }
      if (senha !== confirmarSenha) {
        return res.status(400).json({ error: "Senhas não coincidem." });
      }
      if (String(senha).length < 6) {
        return res
          .status(400)
          .json({ error: "Senha deve ter no mínimo 6 caracteres." });
      }

      email = String(email).trim().toLowerCase();

      if (hasAttr(Usuario, "empresaId") && empresaId == null) {
        return res
          .status(400)
          .json({ error: "empresaId não identificado para este tenant." });
      }

      const whereEmail = { email };
      if (hasAttr(Usuario, "empresaId") && empresaId != null) {
        whereEmail.empresaId = empresaId;
      }
      const existente = await Usuario.findOne({ where: whereEmail });
      if (existente) {
        return res.status(400).json({ error: "Email já cadastrado." });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const payload = { nome, email, senhaHash, ativo: true };
      if (hasAttr(Usuario, "empresaId") && empresaId != null) {
        payload.empresaId = empresaId;
      }

      const usuario = await Usuario.create(payload);
      return res.status(201).json(sanitize(usuario));
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async listar(req, res) {
    try {
      const { db, empresaId } = await getDbAndEmpresaId(req);
      const Usuario = getModel(db, "Usuario");
      if (!Usuario) {
        console.error("[usuarios] Modelo 'Usuario' não encontrado no tenant.");
        return res
          .status(500)
          .json({ error: "Modelo Usuario não registrado para este tenant." });
      }

      const where = {};
      if (hasAttr(Usuario, "empresaId") && empresaId != null) {
        where.empresaId = empresaId;
      }

      const order = hasAttr(Usuario, "createdAt")
        ? [["createdAt", "DESC"]]
        : [["nome", "ASC"]];

      const attributes = ["id", "nome", "email", "ativo"];
      if (hasAttr(Usuario, "createdAt")) attributes.push("createdAt");

      const usuarios = await Usuario.findAll({ where, attributes, order });
      return res.json(usuarios);
    } catch (err) {
      console.error("Erro ao listar usuários:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async atualizar(req, res) {
    try {
      const { db, empresaId } = await getDbAndEmpresaId(req);
      const Usuario = getModel(db, "Usuario");
      if (!Usuario) {
        console.error("[usuarios] Modelo 'Usuario' não encontrado no tenant.");
        return res
          .status(500)
          .json({ error: "Modelo Usuario não registrado para este tenant." });
      }

      const id = Number(req.params.id);
      let { nome, email, senha, confirmarSenha } = req.body || {};

      const whereId = { id };
      if (hasAttr(Usuario, "empresaId") && empresaId != null) {
        whereId.empresaId = empresaId;
      }

      const usuario = await Usuario.findOne({ where: whereId });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      if (email !== undefined && email !== null) {
        email = String(email).trim().toLowerCase();
        const dupWhere = { email, id: { [Op.ne]: id } };
        if (hasAttr(Usuario, "empresaId") && empresaId != null) {
          dupWhere.empresaId = empresaId;
        }
        const duplicado = await Usuario.findOne({ where: dupWhere });
        if (duplicado) {
          return res.status(400).json({ error: "Email já cadastrado." });
        }
        usuario.email = email;
      }

      if (nome !== undefined && nome !== null) {
        usuario.nome = nome;
      }

      if (senha !== undefined || confirmarSenha !== undefined) {
        if (senha !== confirmarSenha) {
          return res.status(400).json({ error: "Senhas não coincidem." });
        }
        if (!senha || String(senha).length < 6) {
          return res
            .status(400)
            .json({ error: "Senha deve ter no mínimo 6 caracteres." });
        }
        usuario.senhaHash = await bcrypt.hash(senha, 10);
      }

      await usuario.save();
      return res.json(sanitize(usuario));
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async toggleAtivo(req, res) {
    try {
      const { db, empresaId } = await getDbAndEmpresaId(req);
      const Usuario = getModel(db, "Usuario");
      if (!Usuario) {
        console.error("[usuarios] Modelo 'Usuario' não encontrado no tenant.");
        return res
          .status(500)
          .json({ error: "Modelo Usuario não registrado para este tenant." });
      }

      const id = Number(req.params.id);
      const { ativo } = req.body || {};

      const whereId = { id };
      if (hasAttr(Usuario, "empresaId") && empresaId != null) {
        whereId.empresaId = empresaId;
      }

      const usuario = await Usuario.findOne({ where: whereId });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      usuario.ativo = !!ativo;
      await usuario.save();
      return res.json(sanitize(usuario));
    } catch (err) {
      console.error("Erro ao alterar ativo:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },

  async deletar(req, res) {
    try {
      const { db, empresaId } = await getDbAndEmpresaId(req);
      const Usuario = getModel(db, "Usuario");
      if (!Usuario) {
        console.error("[usuarios] Modelo 'Usuario' não encontrado no tenant.");
        return res
          .status(500)
          .json({ error: "Modelo Usuario não registrado para este tenant." });
      }

      const id = Number(req.params.id);
      const whereId = { id };
      if (hasAttr(Usuario, "empresaId") && empresaId != null) {
        whereId.empresaId = empresaId;
      }

      const usuario = await Usuario.findOne({ where: whereId });
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      await usuario.destroy();
      return res.json({ message: "Usuário excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};
