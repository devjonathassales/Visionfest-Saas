// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

// Base da API (altere se usar proxy)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Criar um axios próprio para o app
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("vf_client_access") || "");
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("vf_client_refresh") || "");
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

  // Interceptor: injeta token e tenta refresh em 401
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    const respId = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (
          error.response?.status === 401 &&
          !original._retry &&
          refreshToken
        ) {
          original._retry = true;
          try {
            const { data } = await axios.post(`${API_BASE}/api/cliente/refresh`, { refreshToken });
            const newAccess = data.accessToken;
            const newRefresh = data.refreshToken || refreshToken;

            setAccessToken(newAccess);
            setRefreshToken(newRefresh);
            localStorage.setItem("vf_client_access", newAccess);
            localStorage.setItem("vf_client_refresh", newRefresh);

            original.headers.Authorization = `Bearer ${newAccess}`;
            return api.request(original);
          } catch (err) {
            // refresh falhou → logout
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(respId);
    };
  }, [accessToken, refreshToken]);

  async function login({ email, senha }) {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/cliente/login`, { email, senha });
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
      return { ok: false, error: e?.response?.data?.mensagem || "Falha no login" };
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
      api,
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
  return useContext(AuthCtx);
}
