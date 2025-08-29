import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

function resolveTenant() {
  const env = (import.meta.env.VITE_TENANT || "").trim().toLowerCase();
  if (env) return env;

  try {
    const h = window.location.hostname;
    const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(h);
    const parts = h.split(".");
    if (!isLocalHost && parts.length > 2) return parts[0].toLowerCase();
  } catch {}

  // fallback dev
  return "visionware";
}

const apiCliente = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Header do tenant (default)
apiCliente.defaults.headers.common["X-Tenant"] = resolveTenant();

// Injeta Authorization se houver token
apiCliente.interceptors.request.use((config) => {
  const token = localStorage.getItem("vf_client_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiCliente;
