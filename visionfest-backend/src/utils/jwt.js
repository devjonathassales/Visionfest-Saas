// src/utils/jwt.js
const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessTtl = process.env.JWT_ACCESS_TTL || "24h";
const refreshTtl = process.env.JWT_REFRESH_TTL || "7d";

function signAccess(payload) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessTtl });
}
function signRefresh(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshTtl });
}
function verifyAccess(token) {
  return jwt.verify(token, accessSecret);
}
function verifyRefresh(token) {
  return jwt.verify(token, refreshSecret);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
