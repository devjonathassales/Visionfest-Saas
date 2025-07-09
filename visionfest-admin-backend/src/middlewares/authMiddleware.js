const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "visionfest_secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // adiciona os dados do token no req
    next();
  } catch (err) {
    console.error("Token inválido:", err);
    return res.status(403).json({ mensagem: "Token inválido" });
  }
}

module.exports = authMiddleware;
