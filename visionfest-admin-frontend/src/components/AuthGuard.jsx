import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-4">Carregando sessão...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}
