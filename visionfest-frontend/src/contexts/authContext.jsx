// src/contexts/authContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import apiCliente, { API_BASE } from "/src/utils/apiCliente.js";

const AuthCtx = createContext(null);

// Resolve o tenant por ordem:
// 1) ?dominio= / ?tenant=
// 2) /cliente_<slug>/ na URL
// 3) localStorage('tenant')
// 4) VITE_TENANT
function resolveTenant() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const byQS = (qs.get("dominio") || qs.get("tenant") || "").trim();
    if (byQS) return byQS.toLowerCase();

    const seg1 = window.location.pathname.split("/").filter(Boolean)[0] || "";
    const m = seg1.match(/^cliente[_-]([a-z0-9-]+)$/i);
    if (m && m[1]) return m[1].toLowerCase();

    const byLS = (localStorage.getItem("tenant") || "").trim();
    if (byLS) return byLS.toLowerCase();

    const byEnv = (import.meta.env.VITE_TENANT || "").trim();
    if (byEnv) return byEnv.toLowerCase();
  } catch {}
  return "";
}

export function AuthProvider({ children }) {
  const [tenant, setTenant] = useState(() => resolveTenant());
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("vf_client_access") || ""
  );
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("vf_client_refresh") || ""
  );

  // --- legacy (mantido p/ compatibilidade com telas atuais) ---
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem("vf_client_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [empresa, setEmpresa] = useState(() => {
    const raw = localStorage.getItem("vf_client_empresa");
    return raw ? JSON.parse(raw) : null;
  });

  // --- NOVO: usuário normalizado via /api/me ---
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("vf_client_user_norm");
    return raw ? JSON.parse(raw) : null; // { id, name, email, type }
  });

  const [loading, setLoading] = useState(false);
  const isAuthenticated = !!accessToken;

  // Define/atualiza X-Tenant nos defaults do axios compartilhado
  useEffect(() => {
    const t = resolveTenant();
    if (t) {
      setTenant(t);
      apiCliente.defaults.headers.common["X-Tenant"] = t;
      localStorage.setItem("tenant", t);
    } else {
      delete apiCliente.defaults.headers.common["X-Tenant"];
      localStorage.removeItem("tenant");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Injeta Authorization e X-Tenant em TODAS as requests do apiCliente
  useEffect(() => {
    const id = apiCliente.interceptors.request.use((config) => {
      if (tenant) config.headers["X-Tenant"] = tenant;
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
    return () => apiCliente.interceptors.request.eject(id);
  }, [accessToken, tenant]);

  // -------- /api/me: carrega usuário normalizado --------
  async function loadMe() {
    try {
      const r = await apiCliente.get("/me", {
        headers: { "X-Tenant": tenant || resolveTenant() },
      });
      const { usuario: u, empresa: e } = r?.data || {};

      const norm = {
        id: u?.id ?? null,
        name: u?.nome || u?.name || u?.email?.split("@")[0] || "Usuário",
        email: u?.email ?? null,
        type: u?.tipo || (u?.isAdmin ? "admin" : "usuario"), // admin | usuario
        empresaId: u?.empresaId ?? e?.id ?? null,
        roles: Array.isArray(u?.roles) ? u.roles : [],
        empresa: e
          ? { id: e.id, nome: e.nome, dominio: e.dominio, status: e.status }
          : null,
      };

      setUser(norm);
      localStorage.setItem("vf_client_user_norm", JSON.stringify(norm));
      return norm;
    } catch (e) {
      console.warn("Falha ao carregar /me:", e?.response?.data || e);
      const guest = { id: null, name: "Usuário", email: null, type: "guest" };
      setUser(guest);
      localStorage.setItem("vf_client_user_norm", JSON.stringify(guest));
      return guest;
    }
  }

  // Recarrega /api/me quando token/tenant mudam (após login, refresh, troca de tenant)
  useEffect(() => {
    if (accessToken) {
      loadMe();
    } else {
      // se deslogar, limpa user norm
      setUser(null);
      localStorage.removeItem("vf_client_user_norm");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, tenant]);

  // -------- LOGIN --------
  async function login({ email, senha }) {
    setLoading(true);
    try {
      const t = resolveTenant();
      if (!t) {
        return {
          ok: false,
          error:
            "Tenant não identificado. Acesse via /cliente_<seu-dominio> ou informe ?dominio= na URL.",
        };
      }

      // Login na rota pública do backend (mantida)
      const url = `${API_BASE}/api/cliente/login?dominio=${encodeURIComponent(
        t
      )}`;
      const { data } = await axios.post(
        url,
        { email, senha, password: senha, dominio: t },
        { headers: { "Content-Type": "application/json", "X-Tenant": t } }
      );

      // Persiste tokens e dados legados (compatibilidade)
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUsuario(data.usuario || null);
      setEmpresa(data.empresa || null);

      localStorage.setItem("vf_client_access", data.accessToken);
      localStorage.setItem("vf_client_refresh", data.refreshToken);
      localStorage.setItem(
        "vf_client_user",
        JSON.stringify(data.usuario || {})
      );
      localStorage.setItem(
        "vf_client_empresa",
        JSON.stringify(data.empresa || {})
      );
      localStorage.setItem("tenant", t);

      // Defaults p/ próximas requests
      apiCliente.defaults.headers.common["X-Tenant"] = t;

      // NOVO: carrega o usuário normalizado
      await loadMe();

      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error:
          e?.response?.data?.mensagem ||
          e?.response?.data?.error ||
          "Falha no login",
      };
    } finally {
      setLoading(false);
    }
  }

  // -------- LOGOUT --------
  async function logout() {
    try {
      // se existir uma rota de logout no backend, chame aqui:
      // await apiCliente.post("/api/logout", {}, { withCredentials: true });
    } catch {}
    setAccessToken("");
    setRefreshToken("");
    setUsuario(null);
    setEmpresa(null);
    setUser(null);

    localStorage.removeItem("vf_client_access");
    localStorage.removeItem("vf_client_refresh");
    localStorage.removeItem("vf_client_user");
    localStorage.removeItem("vf_client_empresa");
    localStorage.removeItem("vf_client_user_norm");
    // mantém tenant no LS
  }

  const value = useMemo(
    () => ({
      apiCliente,
      api: apiCliente, // alias
      isAuthenticated,
      accessToken,
      // NOVO: usuário normalizado para Navbar etc.
      user,
      // legado (mantido p/ telas antigas)
      usuario,
      empresa,

      login,
      logout,
      loading,

      tenant,
      setTenant,

      // util opcional (se precisar revalidar manualmente)
      reloadMe: loadMe,
    }),
    [isAuthenticated, accessToken, user, usuario, empresa, loading, tenant]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
