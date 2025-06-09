import React from 'react';
import { FiMenu } from 'react-icons/fi';

export default function Navbar({ username = "Usuário", onToggleSidebar }) {
  return (
    <header className="w-full bg-primary text-white flex justify-between items-center px-6 py-3 shadow font-montserrat">
      <div className="flex items-center gap-4">
        {/* Botão hambúrguer visível no mobile */}
        <button className="md:hidden" onClick={onToggleSidebar}>
          <FiMenu size={24} />
        </button>
        <h1 className="text-xl">🎉 VisionFest</h1>
      </div>
      <div className="text-sm">Bem-vindo, <strong>{username}</strong></div>
    </header>
  );
}
