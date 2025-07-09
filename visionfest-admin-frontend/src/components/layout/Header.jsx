import React, { useState } from "react";
import { Menu, X, UserCircle } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 text-white h-16 flex items-center px-4 md:px-8 z-50 shadow">
      {/* Mobile Hamburger */}
      <button
        className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-700 focus:outline-none"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Título do painel */}
      <h1 className="text-lg font-bold flex-grow">Painel Administrativo VisionFest</h1>

      {/* Usuário / perfil */}
      <button className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-md focus:outline-none">
        <UserCircle size={24} />
        <span className="hidden sm:inline">Jonathas</span>
      </button>
    </header>
  );
}
