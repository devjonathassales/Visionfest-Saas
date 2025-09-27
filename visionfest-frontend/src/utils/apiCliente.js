import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

// ---------- Descoberta do tenant ----------
function resolveTenant() {
  const normalize = (s) =>
    (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/^cliente[_-]/, "");

  const qs = new URLSearchParams(window.location.search);
  const byQS = normalize(qs.get("dominio") || qs.get("tenant"));

  let bySub = null;
  try {
    const host = window.location.hostname; // ex.: cliente_visionware.lvh.me
    const parts = host.split(".");
    if (parts.length > 2) bySub = normalize(parts[0]);
  } catch {}

  const byLS = normalize(localStorage.getItem("tenant"));
  const byEnv = normalize(import.meta.env.VITE_TENANT);

  return normalize(byQS || bySub || byLS || byEnv);
}

// ---------- Instância base (/api já incluso) ----------
const apiCliente = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false, // <<< IMPORTANTE: não enviar cookies/credenciais
  headers: {
    "Content-Type": "application/json",
  },
});

// redundância defensiva (caso alguém altere em runtime)
apiCliente.defaults.withCredentials = false;

// ---------- Request: injeta headers ----------
apiCliente.interceptors.request.use((config) => {
  const tenant = resolveTenant();
  if (tenant) {
    config.headers["X-Tenant"] = tenant;
    localStorage.setItem("tenant", tenant);
  }

  const access = localStorage.getItem("vf_client_access");
  if (access) config.headers.Authorization = `Bearer ${access}`;

  return config;
});

// ---------- Response: refresh automático ----------
let isRefreshing = false;
let refreshQueue = [];

function enqueueRequest(cb) {
  return new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject, cb });
  });
}

function flushQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject, cb }) => {
    if (error) reject(error);
    else resolve(cb(token));
  });
  refreshQueue = [];
}

apiCliente.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;

    if (!error?.response || error.response.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    if (/\/api\/cliente\/(login|refresh|logout)/.test(original?.url || "")) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      try {
        const result = await enqueueRequest((newToken) => {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiCliente.request(original);
        });
        return result;
      } catch (e) {
        return Promise.reject(e);
      }
    }

    isRefreshing = true;
    try {
      const tenant = resolveTenant();
      const refreshToken = localStorage.getItem("vf_client_refresh");
      if (!refreshToken || !refreshToken.includes(".")) {
        throw new Error("Refresh token ausente ou inválido");
      }

      const { data } = await axios.post(
        `${API_BASE}/api/cliente/refresh`,
        { refreshToken },
        {
          headers: tenant ? { "X-Tenant": tenant } : {},
          withCredentials: false, // reforço
        }
      );

      const newAccess = data?.accessToken;
      const newRefresh = data?.refreshToken || refreshToken;
      if (!newAccess) throw new Error("Refresh não retornou accessToken");

      localStorage.setItem("vf_client_access", newAccess);
      localStorage.setItem("vf_client_refresh", newRefresh);

      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;

      flushQueue(null, newAccess);
      return apiCliente.request(original);
    } catch (e) {
      localStorage.removeItem("vf_client_access");
      localStorage.removeItem("vf_client_refresh");
      flushQueue(e, null);

      if (window.location.pathname !== "/login") {
        try {
          const t = resolveTenant();
          const qs = t ? `?dominio=${encodeURIComponent(t)}` : "";
          window.location.replace(`/login${qs}`);
        } catch {}
      }
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiCliente;
