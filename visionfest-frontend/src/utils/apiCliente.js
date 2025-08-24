// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

function extractSubdomain(host) {
  if (!host) return null;
  const h = host.split(":")[0];
  const parts = h.split(".");
  if (parts.length <= 1) return null;
  return parts[0];
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cliente_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // mande o tenant sempre, por subdomínio ou variável de ambiente
  const sub = extractSubdomain(window.location.hostname);
  const forcedTenant = import.meta.env.VITE_TENANT; // opcional para dev
  const tenant = forcedTenant || sub || "visionware"; // ajuste o default conforme seu ambiente
  config.headers["x-tenant"] = tenant;

  return config;
});

export default api;
