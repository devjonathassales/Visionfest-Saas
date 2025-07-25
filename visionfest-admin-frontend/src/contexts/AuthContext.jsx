import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("usuario");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("accessToken") || null);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    }

    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.warn("🔄 Token expirado, tentando renovar...");
          try {
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken || !refreshToken.includes(".")) {
              console.error("❌ Refresh token ausente ou malformado");
              logout();
              return Promise.reject(new Error("Refresh token inválido"));
            }

            const response = await api.post("/auth/refresh", { refreshToken });
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

            // Atualiza tokens
            localStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
            setToken(newAccessToken);

            // Reenvia a requisição original
            error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return api.request(error.config);
          } catch (refreshError) {
            console.error("❌ Falha ao renovar token:", refreshError.message);
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [token]);

  async function fetchUser() {
    if (!token) return;

    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      localStorage.setItem("usuario", JSON.stringify(response.data));
    } catch (err) {
      console.error("❌ Erro ao buscar usuário:", err.message);
      logout();
    }
  }

  function login(accessToken, refreshToken, usuario) {
    if (!accessToken || !refreshToken) {
      console.error("❌ Tokens inválidos no login!");
      logout();
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("usuario", JSON.stringify(usuario));

    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    setToken(accessToken);
    setUser(usuario);
  }

  function logout() {
    console.log("🚪 Logout efetuado.");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("usuario");

    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);

    navigate("/login", { replace: true });
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
