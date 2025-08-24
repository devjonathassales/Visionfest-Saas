const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { AdminUser, Permissao } = require("../models");

const SECRET_KEY = process.env.JWT_SECRET || "visionfest_secret";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "visionfest_refresh_secret";

// Gera access token com payload completo
function gerarAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      permissoes: user.permissoes,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
}

// Gera refresh token apenas com ID
function gerarRefreshToken(user) {
  return jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: "7d" });
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ mensagem: "Email e senha são obrigatórios." });
    }

    // 🔥 Inclui explicitamente o campo 'senha'
    const user = await AdminUser.scope("withPassword").findOne({
      where: { email },
      include: [
        {
          model: Permissao,
          as: "permissoes",
          attributes: ["chave"],
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ mensagem: "Usuário não encontrado." });
    }

    if (!user.senha) {
      console.error("⚠️ Usuário sem senha no banco:", user.email);
      return res
        .status(500)
        .json({ mensagem: "Usuário com senha não definida." });
    }

    const senhaCorreta = await bcrypt.compare(password, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "Senha inválida." });
    }

    const permissoesObj = {};
    user.permissoes.forEach((p) => {
      permissoesObj[p.chave] = true;
    });

    const accessToken = gerarAccessToken({
      ...user.toJSON(),
      permissoes: permissoesObj,
    });

    const refreshToken = gerarRefreshToken(user);

    await user.update({ refreshToken });

    res.status(200).json({
      mensagem: "Login realizado com sucesso",
      accessToken,
      refreshToken,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissoes: permissoesObj,
      },
    });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
}

async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token é obrigatório." });
  }

  if (typeof refreshToken !== "string" || !refreshToken.split(".")[1]) {
    return res.status(400).json({ error: "Formato de refresh token inválido." });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = await AdminUser.findByPk(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      if (user) await user.update({ refreshToken: null });
      return res.status(403).json({ error: "Refresh token inválido." });
    }

    // Regenerar os tokens
    const permissoes = await user.getPermissoes({ attributes: ["chave"] });
    const permissoesObj = {};
    permissoes.forEach((p) => {
      permissoesObj[p.chave] = true;
    });

    const accessToken = gerarAccessToken({
      ...user.toJSON(),
      permissoes: permissoesObj,
    });

    const newRefreshToken = gerarRefreshToken(user);
    await user.update({ refreshToken: newRefreshToken });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissoes: permissoesObj,
      },
    });
  } catch (err) {
    console.error("❌ Erro ao validar refreshToken:", err.message);
    return res
      .status(401)
      .json({ error: "Refresh token inválido ou expirado." });
  }
}

async function logout(req, res) {
  try {
    const { id } = req.user;
    await AdminUser.update({ refreshToken: null }, { where: { id } });
    res.status(200).json({ mensagem: "Logout realizado com sucesso." });
  } catch (err) {
    console.error("Erro no logout:", err);
    res.status(500).json({ mensagem: "Erro ao realizar logout." });
  }
}

async function getProfile(req, res) {
  try {
    const { id } = req.user;
    const user = await AdminUser.findByPk(id, {
      include: {
        model: Permissao,
        as: "permissoes",
        attributes: ["chave"],
        through: { attributes: [] },
      },
    });

    if (!user)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });

    const permissoesObj = {};
    user.permissoes.forEach((p) => {
      permissoesObj[p.chave] = true;
    });

    res.status(200).json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      permissoes: permissoesObj,
    });
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    res.status(500).json({ mensagem: "Erro ao buscar perfil do usuário." });
  }
}

module.exports = {
  login,
  refreshToken,
  getProfile,
  logout,
};