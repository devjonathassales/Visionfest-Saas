const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ mensagem: "Token não fornecido." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ mensagem: "Formato de token inválido. Use 'Bearer <token>'." });
  }

  const [scheme, token] = parts;

  if (scheme.toLowerCase() !== "bearer" || !token || token.trim() === "") {
    return res.status(401).json({ mensagem: "Formato de token inválido. Use 'Bearer <token>'." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Erro na autenticação:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ mensagem: "Token expirado." });
    }

    return res.status(401).json({ mensagem: "Token inválido." });
  }
}

module.exports = authMiddleware;
