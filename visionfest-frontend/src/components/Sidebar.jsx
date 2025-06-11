import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiUser, FiBox, FiDollarSign, FiSettings, FiLogOut
} from 'react-icons/fi';

const menuItems = [
  { label: "Cadastros", path: "/cadastros", icon: <FiUser /> },
  { label: "Estoque", path: "/estoque", icon: <FiBox /> },
  { label: "Financeiro", path: "/financeiro", icon: <FiDollarSign /> },
  { label: "Configurações", path: "/configuracoes", icon: <FiSettings /> },
  { label: "Sair", path: "/logout", icon: <FiLogOut /> },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed top-[56px] left-0 z-50 h-[calc(100vh-56px)] w-64 bg-silver text-black p-4 shadow-md
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:block
        `}
      >
        <nav className="flex flex-col gap-2 font-opensans">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={idx}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded transition
                  ${isActive
                    ? 'bg-primary text-white font-semibold'
                    : 'hover:bg-primary hover:text-white text-black'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
