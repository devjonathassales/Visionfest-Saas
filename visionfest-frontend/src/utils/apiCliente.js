// src/utils/apiCliente.js
import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

// ---------- Descoberta do tenant ----------
function resolveTenant() {
  const qs = new URLSearchParams(window.location.search);
  const byQS = qs.get("dominio") || qs.get("tenant");

  let bySub = null;
  try {
    const host = window.location.hostname; // cliente_xxx.lvh.me
    const parts = host.split(".");
    if (parts.length > 2) bySub = parts[0];
  } catch {}

  const byLS = localStorage.getItem("tenant");
  const byEnv = import.meta.env.VITE_TENANT;

  return (byQS || bySub || byLS || byEnv || "").trim().toLowerCase();
}

// ---------- Instância base (/api já incluso) ----------
const apiCliente = axios.create({
  baseURL: `${API_BASE}/api`,
});

// ---------- Request: injeta headers ----------
apiCliente.interceptors.request.use((config) => {
  const tenant = resolveTenant();
  if (tenant) {
    config.headers["X-Tenant"] = tenant;
    // persiste pra próximas páginas sem querystring
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

    // se não for 401 ou já tentamos, só rejeita
    if (!error?.response || error.response.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    // evita tentar refresh em rotas do próprio refresh/login
    if (/\/api\/cliente\/(login|refresh|logout)/.test(original?.url || "")) {
      return Promise.reject(error);
    }

    // marca pra não cair em loop
    original._retry = true;

    // se já tem refresh em andamento, coloca na fila
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

    // inicia refresh
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
        }
      );

      const newAccess = data?.accessToken;
      const newRefresh = data?.refreshToken || refreshToken;

      if (!newAccess) throw new Error("Refresh não retornou accessToken");

      // salva e aplica
      localStorage.setItem("vf_client_access", newAccess);
      localStorage.setItem("vf_client_refresh", newRefresh);

      // aplica no request original
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;

      // libera a fila
      flushQueue(null, newAccess);

      // re-tenta o original
      return apiCliente.request(original);
    } catch (e) {
      // falhou o refresh -> limpa sessão e manda pro login
      localStorage.removeItem("vf_client_access");
      localStorage.removeItem("vf_client_refresh");

      flushQueue(e, null);
      // opcional: redirecionar
      if (window.location.pathname !== "/login") {
        try {
          // preserva tenant na url, se havia
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
