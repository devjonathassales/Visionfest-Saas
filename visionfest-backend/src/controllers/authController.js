// src/controllers/authClienteController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { resolveEmpresaFromReq, getTenantDb } = require("../utils/tenant");
console.log("[authClienteController] file:", __filename);
console.log("[authClienteController] build:", new Date().toISOString());

const ACCESS_SECRET =
  process.env.JWT_SECRET_CLIENT || "visionfest_client_secret";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET_CLIENT || "visionfest_refresh_secret_client";
const ACCESS_EXPIRES_IN = process.env.JWT_CLIENT_EXPIRES_IN || "1h";
const REFRESH_EXPIRES_IN = process.env.JWT_CLIENT_REFRESH_EXPIRES_IN || "7d";

function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

exports.login = async (req, res) => {
  const tag = `[LOGIN ${new Date().toISOString()}]`;
  let stage = "init";
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res
        .status(400)
        .json({ mensagem: "Email e senha são obrigatórios." });
    }

    // 1) Resolve domínio (header -> query/body -> DEFAULT_TENANT)
    stage = "resolve-dominio";
    const dominio = (
      req.headers["x-tenant"] ||
      req.query?.dominio ||
      req.query?.tenant ||
      req.body?.dominio ||
      req.body?.tenant ||
      process.env.DEFAULT_TENANT ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    console.log(
      `${tag} host=%s origin=%s x-tenant=%s q.dominio=%s b.dominio=%s => dominio=%s`,
      req.hostname,
      req.headers.origin,
      req.headers["x-tenant"],
      req.query?.dominio,
      req.body?.dominio,
      dominio
    );

    if (!dominio) {
      return res.status(400).json({
        mensagem:
          "Informe o domínio (X-Tenant, ?dominio=, subdomínio/Origin ou DEFAULT_TENANT).",
      });
    }

    // 2) Admin: busca empresa por domínio
    stage = "painel-empresa";
    const { Empresa } = require("../lib/adminDb");
    const empresa = await Empresa.findOne({ where: { dominio } });
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });
    if (empresa.status && empresa.status !== "ativo") {
      return res.status(403).json({ mensagem: "Empresa inativa." });
    }
    if (!empresa.bancoDados) {
      return res
        .status(500)
        .json({ mensagem: "Empresa sem schema configurado." });
    }

    // 3) Tenant DB
    stage = "tenant-connect";
    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;
    const tSequelize = db.sequelize || (Usuario && Usuario.sequelize);
    if (!tSequelize) {
      console.error(`${tag} Sequelize do tenant ausente`);
      return res.status(500).json({ mensagem: "Erro interno no login." });
    }

    // 4) Busca usuário (case-insensitive)
    stage = "usuario-busca";
    const emailNorm = String(email).toLowerCase();
    let user = await Usuario.findOne({
      where: tSequelize.where(
        tSequelize.fn("LOWER", tSequelize.col("email")),
        emailNorm
      ),
    });
    if (!user) {
      user = await Usuario.findOne({
        where: { email: { [Op.iLike]: emailNorm } },
      });
    }
    if (!user)
      return res.status(401).json({ mensagem: "Credenciais inválidas." });

    // 5) Valida senha (campo EXATO: senhaHash)
    stage = "bcrypt-compare";
    const ok = await bcrypt.compare(String(senha), user.senhaHash || "");
    if (!ok)
      return res.status(401).json({ mensagem: "Credenciais inválidas." });

    // 6) Emite tokens
    stage = "tokens";
    const permissoes = user.permissoes || {};
    const accessToken = signAccess({
      usuarioId: user.id,
      empresaId: empresa.id,
      tenant: empresa.bancoDados,
      permissoes,
    });
    const refreshToken = signRefresh({
      usuarioId: user.id,
      empresaId: empresa.id,
    });

    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      await user.update({ refreshToken });
    }

    console.log(
      `${tag} OK usuarioId=${user.id} empresa=${empresa.dominio}/${empresa.bancoDados}`
    );
    return res.json({
      mensagem: "Login ok",
      accessToken,
      refreshToken,
      usuario: { id: user.id, nome: user.nome, email: user.email, permissoes },
      empresa: {
        id: empresa.id,
        dominio: empresa.dominio,
        schema: empresa.bancoDados,
        status: empresa.status,
      },
    });
  } catch (e) {
    console.error(`${tag} ERRO stage=${stage}`, e);
    if (process.env.NODE_ENV !== "production") {
      return res
        .status(500)
        .json({ mensagem: "Erro interno no login.", stage, detail: e.message });
    }
    return res.status(500).json({ mensagem: "Erro interno no login." });
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
      return res
        .status(401)
        .json({ mensagem: "Refresh token inválido ou expirado." });
    }

    const empresa = await resolveEmpresaFromReq(req);
    if (!empresa)
      return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    const user = await Usuario.findByPk(decoded.usuarioId);
    if (!user)
      return res.status(401).json({ mensagem: "Usuário não encontrado." });

    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      if (user.refreshToken !== refreshToken) {
        return res
          .status(403)
          .json({ mensagem: "Refresh token não corresponde." });
      }
    }

    const permissoes = user.permissoes || {};
    const newAccess = signAccess({
      usuarioId: user.id,
      empresaId: empresa.id,
      tenant: empresa.bancoDados,
      permissoes,
    });
    const newRefresh = signRefresh({
      usuarioId: user.id,
      empresaId: empresa.id,
    });

    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      await user.update({ refreshToken: newRefresh });
    }

    return res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
      usuario: { id: user.id, nome: user.nome, email: user.email, permissoes },
    });
  } catch (e) {
    console.error("Erro refresh cliente:", e);
    return res.status(500).json({ mensagem: "Erro ao renovar token." });
  }
};

exports.me = async (req, res) => {
  try {
    const empresa = await resolveEmpresaFromReq(req);
    if (!empresa)
      return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    const user = await Usuario.findByPk(req.user.usuarioId);
    if (!user)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });

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
    if (!empresa)
      return res.status(401).json({ mensagem: "Empresa não identificada." });

    const db = await getTenantDb(empresa.bancoDados);
    const { Usuario } = db;

    if (Usuario.rawAttributes && Usuario.rawAttributes.refreshToken) {
      await Usuario.update(
        { refreshToken: null },
        { where: { id: req.user.usuarioId } }
      );
    }

    return res.json({ mensagem: "Logout realizado com sucesso." });
  } catch (e) {
    console.error("Erro logout cliente:", e);
    return res.status(500).json({ mensagem: "Erro ao realizar logout." });
  }
};
