const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Usuario, Empresa } = require("../models");

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: "Senha inválida." });
    }

    // Recupera o bancoCliente pelo relacionamento com a empresa
    const empresa = await Empresa.findByPk(usuario.empresaId);
    if (!empresa) {
      return res.status(403).json({ error: "Empresa não encontrada." });
    }

    const token = jwt.sign(
      {
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        bancoCliente: empresa.bancoDados, // 🔑 Multi-tenant
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, usuario });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro no servidor." });
  }
};
