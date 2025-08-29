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

export function AuthProvider({ children }) {
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

  // Garante X-Tenant (pode vir de env, query ?dominio= ou localStorage)
  useEffect(() => {
    try {
      const byEnv = (import.meta.env.VITE_TENANT || "").trim();
      const byQS = new URLSearchParams(window.location.search).get("dominio");
      const byLS = localStorage.getItem("tenant");
      const tenant =
        (byEnv && byEnv) ||
        (byQS && String(byQS).trim()) ||
        (byLS && String(byLS).trim()) ||
        null;

      if (tenant) {
        apiCliente.defaults.headers.common["X-Tenant"] = tenant;
        localStorage.setItem("tenant", tenant);
      }
    } catch {}
  }, []);

  // Interceptores: injeta Bearer e tenta refresh em 401 (uma vez)
  useEffect(() => {
    const reqId = apiCliente.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    const respId = apiCliente.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (
          error?.response?.status === 401 &&
          !original?._retry &&
          refreshToken
        ) {
          original._retry = true;
          try {
            const tenant = apiCliente.defaults.headers.common["X-Tenant"];
            const { data } = await axios.post(
              `${API_BASE}/api/cliente/refresh`,
              { refreshToken },
              { headers: tenant ? { "X-Tenant": tenant } : {} }
            );

            const newAccess = data.accessToken;
            const newRefresh = data.refreshToken || refreshToken;

            setAccessToken(newAccess);
            setRefreshToken(newRefresh);
            localStorage.setItem("vf_client_access", newAccess);
            localStorage.setItem("vf_client_refresh", newRefresh);

            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccess}`;
            return apiCliente.request(original);
          } catch {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiCliente.interceptors.request.eject(reqId);
      apiCliente.interceptors.response.eject(respId);
    };
  }, [accessToken, refreshToken]);

  async function login({ email, senha }) {
    setLoading(true);
    try {
      const tenant = apiCliente.defaults.headers.common["X-Tenant"];
      // usa axios "cru" para evitar o interceptor de refresh durante o login
      const { data } = await axios.post(
        `${API_BASE}/api/cliente/login`,
        { email, senha },
        { headers: tenant ? { "X-Tenant": tenant } : {} }
      );

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUsuario(data.usuario);
      setEmpresa(data.empresa);

      localStorage.setItem("vf_client_access", data.accessToken);
      localStorage.setItem("vf_client_refresh", data.refreshToken);
      localStorage.setItem("vf_client_user", JSON.stringify(data.usuario));
      localStorage.setItem("vf_client_empresa", JSON.stringify(data.empresa));

      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e?.response?.data?.mensagem || "Falha no login",
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
    }),
    [isAuthenticated, accessToken, usuario, empresa, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
