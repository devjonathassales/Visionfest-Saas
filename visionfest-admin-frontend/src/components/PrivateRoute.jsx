import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, token } = useAuth();

  if (!user || !token) {
    // 🔒 Não autenticado → Redireciona para login
    return <Navigate to="/" replace />;
  }

  return children;
}
