const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "visionfest_secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ mensagem: "Token de autenticação não fornecido." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ mensagem: "Formato do token inválido. Use 'Bearer <token>'." });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ mensagem: "Prefixo 'Bearer' ausente ou incorreto." });
  }

  if (!token || token.trim() === "") {
    return res.status(401).json({ mensagem: "Token ausente após o prefixo 'Bearer'." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Erro na verificação do token JWT:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ mensagem: "Token expirado." });
    }

    return res.status(401).json({ mensagem: "Token inválido ou corrompido." });
  }
}

module.exports = authMiddleware;
