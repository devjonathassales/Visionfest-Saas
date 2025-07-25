const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Empresa } = require("../dbPrincipal"); // IMPORTA daqui agora
const { getDbCliente } = require("../utils/multiTenant");

exports.login = async (req, res) => {
  const { dominio, email, senha } = req.body;

  try {
    // 1. Busca empresa no banco principal
    const empresa = await Empresa.findOne({ where: { dominio } });
    if (!empresa) {
      return res.status(404).json({ mensagem: "Empresa não encontrada." });
    }
    if (empresa.status !== "ativo") {
      return res.status(403).json({ mensagem: "Empresa inativa ou bloqueada." });
    }

    // 2. Conecta no banco do cliente
    const dbCliente = await getDbCliente(empresa.bancoDados);
    const Usuario = dbCliente.models.Usuario;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensagem: "Usuário ou senha inválidos." });
    }

    // 3. Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ mensagem: "Usuário ou senha inválidos." });
    }

    // 4. Gera JWT
    const token = jwt.sign(
      {
        usuarioId: usuario.id,
        empresaId: empresa.id,
        bancoCliente: empresa.bancoDados,
        permissoes: usuario.permissoes,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Retorna token e dados
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        permissoes: usuario.permissoes,
      },
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        dominio: empresa.dominio,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ mensagem: "Erro interno no login." });
  }
};
