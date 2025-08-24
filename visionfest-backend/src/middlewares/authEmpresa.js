// src/middlewares/authCliente.js
const jwt = require("jsonwebtoken");
const ACCESS_SECRET = process.env.JWT_SECRET_CLIENT || "visionfest_client_secret";

module.exports = function authCliente(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ mensagem: "Token não fornecido." });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // opcional: validar tenant do token vs req.tenant detectado
    // if (req.tenant?.empresa?.id && decoded.empresaId && String(req.tenant.empresa.id) !== String(decoded.empresaId)) {
    //   return res.status(401).json({ mensagem: "Token não corresponde ao tenant." });
    // }

    req.user = decoded; // { usuarioId, empresaId, tenant, permissoes, iat, exp }
    return next();
  } catch (err) {
    console.error("Erro token cliente:", err.message);
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
};
