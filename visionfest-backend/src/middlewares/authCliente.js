// src/middlewares/authCliente.js
const jwt = require("jsonwebtoken");

// 🔐 MESMO segredo do controller
const ACCESS_SECRET =
  process.env.JWT_TENANT_SECRET || process.env.JWT_SECRET || "vf_tenant_secret";

module.exports = function authCliente(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ mensagem: "Token não fornecido." });
  }

  const [scheme, token] = authHeader.split(" ");
  if (!/^Bearer$/i.test(scheme) || !token) {
    return res.status(401).json({ mensagem: "Formato do token inválido." });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ mensagem: "Token expirado." });
    }
    return res.status(401).json({ mensagem: "Token inválido." });
  }
};
