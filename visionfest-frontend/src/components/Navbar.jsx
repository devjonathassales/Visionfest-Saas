import React from 'react';
import { FiMenu } from 'react-icons/fi';

export default function Navbar({ username = "Usuário", onToggleSidebar }) {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-primary text-white flex justify-between items-center px-6 shadow z-50 font-montserrat">
      <div className="flex items-center gap-4">
        <button className="md:hidden" onClick={onToggleSidebar}>
          <FiMenu size={24} />
        </button>
        <h1 className="text-xl font-bold">🎉 VisionFest</h1>
      </div>
      <div className="text-sm">
        Bem-vindo, <strong>{username}</strong>
      </div>
    </header>
  );
}
