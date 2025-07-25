// middlewares/authEmpresa.js
const jwt = require("jsonwebtoken");
const { Empresa } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não informado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const empresa = await Empresa.findByPk(decoded.empresaId);
    if (!empresa) {
      return res.status(401).json({ error: "Empresa não encontrada" });
    }

    req.empresa = empresa; // empresa disponível nos controllers
    req.empresaId = empresa.id; // id direto se precisar
    next();
  } catch (err) {
    console.error("Erro authEmpresa:", err);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};
