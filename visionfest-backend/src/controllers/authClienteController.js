// src/controllers/authClienteController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// 🔐 Segredos unificados (iguais ao middleware)
const ACCESS_SECRET =
  process.env.JWT_TENANT_SECRET || process.env.JWT_SECRET || "vf_tenant_secret";
const REFRESH_SECRET =
  process.env.JWT_TENANT_REFRESH ||
  process.env.JWT_REFRESH_SECRET ||
  "vf_tenant_refresh_secret";

function gerarAccessToken(userPayload) {
  return jwt.sign(
    {
      id: userPayload.id,
      email: userPayload.email || "",
      nome: userPayload.nome || "",
      role: userPayload.role || "user",
      permissoes: userPayload.permissoes || {},
    },
    ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

// Refresh stateless: carrega payload suficiente
function gerarRefreshToken(userPayload) {
  const refreshPayload = {
    userId: userPayload.id,
    email: userPayload.email || "",
    nome: userPayload.nome || "",
    role: userPayload.role || "user",
    permissoes: userPayload.permissoes || {},
  };
  return jwt.sign(refreshPayload, REFRESH_SECRET, { expiresIn: "7d" });
}

// Models do tenant vêm do multiTenantMiddleware
function getTenantModelsFromReq(req) {
  if (!req?.models || !req?.db) {
    throw new Error(
      "Contexto do tenant indisponível. Garanta que /api/cliente passe por multiTenantMiddleware."
    );
  }
  return req.models;
}

const hasAttr = (Model, attr) => !!Model?.rawAttributes?.[attr];

async function login(req, res) {
  try {
    const models = getTenantModelsFromReq(req);

    const { email, senha, password } = req.body || {};
    const senhaInput = senha ?? password;

    if (!email || !senhaInput) {
      return res
        .status(400)
        .json({ mensagem: "Email e senha são obrigatórios." });
    }

    const Usuario = models.Usuario || models.AdminUser;
    if (!Usuario) {
      return res
        .status(500)
        .json({ mensagem: "Model de usuário não disponível no tenant." });
    }

    // Qual é a coluna de senha?
    const passwordField = hasAttr(Usuario, "senhaHash")
      ? "senhaHash"
      : hasAttr(Usuario, "senha")
      ? "senha"
      : hasAttr(Usuario, "password")
      ? "password"
      : null;

    if (!passwordField) {
      return res
        .status(500)
        .json({ mensagem: "Model de usuário não possui campo de senha." });
    }

    // Apenas atributos existentes
    const attrs = ["id", "nome", "email"];
    if (hasAttr(Usuario, "ativo")) attrs.push("ativo");
    if (hasAttr(Usuario, "permissoes")) attrs.push("permissoes");
    if (hasAttr(Usuario, "empresaId")) attrs.push("empresaId");
    attrs.push(passwordField);

    const user = await Usuario.findOne({
      where: { email },
      attributes: attrs,
    });

    if (!user) {
      return res.status(401).json({ mensagem: "Usuário não encontrado." });
    }

    const hash = user.get(passwordField);
    if (!hash) {
      return res
        .status(500)
        .json({ mensagem: "Usuário com senha não definida." });
    }

    const ok = await bcrypt.compare(senhaInput, hash);
    if (!ok) {
      return res.status(401).json({ mensagem: "Senha inválida." });
    }

    // Permissões (JSON na tabela do tenant)
    const permissoesObj =
      (hasAttr(Usuario, "permissoes") && user.permissoes) || {};
    const role = permissoesObj?.superadmin ? "superadmin" : "user";

    const payloadUser = {
      id: user.id,
      nome: user.nome || "",
      email: user.email,
      role,
      permissoes: permissoesObj,
    };

    const accessToken = gerarAccessToken(payloadUser);
    const refreshToken = gerarRefreshToken(payloadUser);

    // Se existir coluna de refreshToken no model do tenant, tenta salvar (opcional)
    if (hasAttr(Usuario, "refreshToken")) {
      try {
        await user.update({ refreshToken });
      } catch (e) {
        // Silencia se a coluna não existir de fato
      }
    }

    // Empresa (opcional)
    let empresaPayload = null;
    if (models.Empresa) {
      const emp = await models.Empresa.findOne({ order: [["id", "ASC"]] });
      if (emp) {
        empresaPayload = {
          id: emp.id,
          nome: emp.nome,
          email: emp.email || null,
          dominio: emp.dominio || null,
        };
      }
    }

    return res.json({
      mensagem: "Login realizado com sucesso",
      accessToken,
      refreshToken,
      usuario: payloadUser,
      empresa: empresaPayload,
    });
  } catch (e) {
    console.error("[authCliente] login:", e);
    return res
      .status(500)
      .json({ mensagem: "Erro interno no login do tenant." });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token é obrigatório." });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      return res
        .status(401)
        .json({ error: "Refresh token inválido ou expirado." });
    }

    // Reconstrói payload do próprio refresh (stateless)
    const payloadUser = {
      id: decoded.userId || decoded.id,
      email: decoded.email || "",
      nome: decoded.nome || "",
      role: decoded.role || "user",
      permissoes: decoded.permissoes || {},
    };

    const newAccess = gerarAccessToken(payloadUser);
    const newRefresh = gerarRefreshToken(payloadUser);

    return res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
      usuario: payloadUser,
    });
  } catch (e) {
    console.error("[authCliente] refresh:", e);
    return res.status(500).json({ error: "Erro ao renovar sessão." });
  }
}

async function me(req, res) {
  try {
    return res.json({
      id: req.user.id,
      email: req.user.email,
      nome: req.user.nome || "",
      role: req.user.role || "user",
      permissoes: req.user.permissoes || {},
    });
  } catch {
    return res.status(500).json({ mensagem: "Erro ao buscar perfil." });
  }
}

async function logout(_req, res) {
  try {
    return res.json({ mensagem: "Logout realizado com sucesso." });
  } catch (e) {
    console.error("[authCliente] logout:", e);
    return res.status(500).json({ mensagem: "Erro ao sair." });
  }
}

module.exports = { login, refresh, me, logout };
