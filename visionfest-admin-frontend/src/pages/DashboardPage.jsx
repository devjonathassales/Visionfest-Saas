import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth(); // Já traz o usuário do contexto

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">
        Bem-vindo, {user?.nome || "Carregando..."} 👋
      </h2>
    </div>
  );
}
