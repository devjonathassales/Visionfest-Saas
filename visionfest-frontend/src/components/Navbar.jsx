// src/components/Navbar.jsx
import React from "react";
import { FiMenu, FiLogOut } from "react-icons/fi";
import { useAuth } from "/src/contexts/authContext.jsx";

export default function Navbar({ username = "Usuário", onToggleSidebar }) {
  const { user, logout } = useAuth?.() ?? {};

  const displayName =
    user?.name || user?.nome || user?.email?.split("@")[0] || username;

  const initials = (displayName || "U")
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") await logout();
      else {
        localStorage.removeItem("cliente_token");
        localStorage.removeItem("token");
        sessionStorage.clear();
        window.location.href = "/login";
      }
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-primary text-white flex justify-between items-center px-6 shadow z-50 font-montserrat">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden"
          onClick={onToggleSidebar}
          aria-label="Abrir menu"
        >
          <FiMenu size={24} />
        </button>
        <h1 className="text-xl font-bold">🎉 VisionFest</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold uppercase"
            title={displayName}
          >
            {initials}
          </div>
          <span className="text-sm">
            Bem-vindo, <strong>{displayName}</strong>
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
          title="Sair"
        >
          <FiLogOut size={18} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
