const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { AdminUser } = require("../models");

const SECRET_KEY = process.env.JWT_SECRET || "visionfest_secret";

/**
 * POST /api/auth/login
 * Realiza login e retorna token JWT + dados do usuário
 */
async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Busca o usuário no banco
    const user = await AdminUser.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ mensagem: "Usuário não encontrado" });
    }

    // Compara senha enviada com hash do banco
    const senhaCorreta = await bcrypt.compare(password, user.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "Senha inválida" });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
}

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado
 */
async function getProfile(req, res) {
  try {
    const user = await AdminUser.findByPk(req.user.id, {
      attributes: ["id", "nome", "email", "role"],
    });

    if (!user) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
}

module.exports = { login, getProfile };
