// src/controllers/authClienteController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");

const ACCESS_SECRET = process.env.JWT_SECRET_CLIENT || "visionfest_client_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_CLIENT || "visionfest_refresh_secret_client";
const ACCESS_EXPIRES_IN = process.env.JWT_CLIENT_EXPIRES_IN || "1h";
const REFRESH_EXPIRES_IN = process.env.JWT_CLIENT_REFRESH_EXPIRES_IN || "7d";

function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ mensagem: "Email e senha são obrigatórios." });
    }

    const empresa = await resolveEmpresaFromReq(req);
    if (!empresa) return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(401).json({ mensagem: "Usuário não encontrado." });

    const ok = await bcrypt.compare(senha, user.senhaHash);
    if (!ok) return res.status(401).json({ mensagem: "Senha inválida." });

    const permissoes = user.permissoes || {};

    const accessToken = signAccess({
      usuarioId: user.id,
      empresaId: empresa.id,
      tenant: empresa.bancoDados,
      permissoes,
    });
    const refreshToken = signRefresh({ usuarioId: user.id, empresaId: empresa.id });

    // ⚠️ Só tenta salvar se a coluna existir no model do tenant
    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      await user.update({ refreshToken });
    }

    return res.json({
      mensagem: "Login ok",
      accessToken,
      refreshToken,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        permissoes,
      },
      empresa: { id: empresa.id, dominio: empresa.dominio, schema: empresa.bancoDados },
    });
  } catch (e) {
    console.error("Erro login cliente:", e);
    return res.status(500).json({ mensagem: "Erro ao autenticar." });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ mensagem: "Refresh token é obrigatório." });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ mensagem: "Refresh token inválido ou expirado." });
    }

    const empresa = await resolveEmpresaFromReq(req);
    if (!empresa) return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    const user = await Usuario.findByPk(decoded.usuarioId);
    if (!user) return res.status(401).json({ mensagem: "Usuário não encontrado." });

    // Se você persistir refreshToken no banco, valide aqui:
    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      if (user.refreshToken !== refreshToken) {
        return res.status(403).json({ mensagem: "Refresh token não corresponde." });
      }
    }

    const permissoes = user.permissoes || {};
    const newAccess = signAccess({
      usuarioId: user.id,
      empresaId: empresa.id,
      tenant: empresa.bancoDados,
      permissoes,
    });
    const newRefresh = signRefresh({ usuarioId: user.id, empresaId: empresa.id });

    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      await user.update({ refreshToken: newRefresh });
    }

    return res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        permissoes,
      },
    });
  } catch (e) {
    console.error("Erro refresh cliente:", e);
    return res.status(500).json({ mensagem: "Erro ao renovar token." });
  }
};

exports.me = async (req, res) => {
  try {
    const empresa = await resolveEmpresaFromReq(req);
    if (!empresa) return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    const user = await Usuario.findByPk(req.user.usuarioId);
    if (!user) return res.status(404).json({ mensagem: "Usuário não encontrado." });

    return res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      permissoes: user.permissoes || {},
    });
  } catch (e) {
    console.error("Erro perfil cliente:", e);
    return res.status(500).json({ mensagem: "Erro ao buscar perfil." });
  }
};

exports.logout = async (req, res) => {
  try {
    const empresa = await resolveEmpresaFromReq(req);
    if (!empresa) return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      await Usuario.update({ refreshToken: null }, { where: { id: req.user.usuarioId } });
    }

    return res.json({ mensagem: "Logout realizado com sucesso." });
  } catch (e) {
    console.error("Erro logout cliente:", e);
    return res.status(500).json({ mensagem: "Erro ao realizar logout." });
  }
};
