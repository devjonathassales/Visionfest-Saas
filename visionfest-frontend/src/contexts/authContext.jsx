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
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem("vf_client_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [empresa, setEmpresa] = useState(() => {
    const raw = localStorage.getItem("vf_client_empresa");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!accessToken;

  // Configura X-Tenant no axios compartilhado
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
  }, []);

  // Injeta Authorization em TODAS as requests do apiCliente.
  // (o apiCliente já tem o interceptor de refresh automático)
  useEffect(() => {
    const id = apiCliente.interceptors.request.use((config) => {
      if (tenant) config.headers["X-Tenant"] = tenant;
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
    return () => apiCliente.interceptors.request.eject(id);
  }, [accessToken, tenant]);

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

      // Login direto na rota pública do backend
      const url = `${API_BASE}/api/cliente/login?dominio=${encodeURIComponent(
        t
      )}`;
      const { data } = await axios.post(
        url,
        { email, senha, password: senha, dominio: t },
        { headers: { "Content-Type": "application/json", "X-Tenant": t } }
      );

      // Persiste
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

      // Prepara defaults para as próximas requests
      apiCliente.defaults.headers.common["X-Tenant"] = t;

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

  function logout() {
    setAccessToken("");
    setRefreshToken("");
    setUsuario(null);
    setEmpresa(null);
    localStorage.removeItem("vf_client_access");
    localStorage.removeItem("vf_client_refresh");
    localStorage.removeItem("vf_client_user");
    localStorage.removeItem("vf_client_empresa");
    // mantém o tenant no LS para continuar no mesmo subdomínio
  }

  const value = useMemo(
    () => ({
      api: apiCliente,
      isAuthenticated,
      accessToken,
      usuario,
      empresa,
      login,
      logout,
      loading,
      tenant,
    }),
    [isAuthenticated, accessToken, usuario, empresa, loading, tenant]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
