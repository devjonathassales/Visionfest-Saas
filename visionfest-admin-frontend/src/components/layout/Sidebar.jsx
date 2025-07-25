import React, { useState } from "react";
import {
  Home,
  Building2,
  Users,
  FileText,
  Settings,
  ClipboardList,
  DollarSign,
  CreditCard,
  Archive,
  Layers,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const modules = [
  {
    title: "Cadastros",
    permissionKey: "visualizarEmpresas",
    links: [
      { to: "/cadastros/empresas", label: "Empresas", permission: "visualizarEmpresas", icon: <Building2 size={18} /> },
      { to: "/cadastros/usuarios", label: "Usuários", permission: "visualizarUsuarios", icon: <Users size={18} /> },
      { to: "/cadastros/planos", label: "Planos", permission: "gerenciarPlanos", icon: <Layers size={18} /> },
    ],
  },
  {
    title: "Financeiro",
    permissionKey: "acessarFinanceiro",
    links: [
      { to: "/financeiro/caixa", label: "Caixa", permission: "abrirCaixa", icon: <DollarSign size={18} /> },
      { to: "/financeiro/contas-pagar", label: "Contas a Pagar", permission: "acessarFinanceiro", icon: <CreditCard size={18} /> },
      { to: "/financeiro/contas-receber", label: "Contas a Receber", permission: "acessarFinanceiro", icon: <CreditCard size={18} /> },
      { to: "/financeiro/centro-custo", label: "acessarFinanceiro", permission: "acessarFinanceiro", icon: <Archive size={18} /> },
      { to: "/financeiro/contas-bancarias", label: "Contas Bancárias", permission: "acessarFinanceiro", icon: <Archive size={18} /> },
    ],
  },
  {
    title: "Relatórios",
    permissionKey: "visualizarRelatorios",
    links: [
      { to: "/relatorios", label: "Relatórios Gerais", permission: "visualizarRelatorios", icon: <FileText size={18} /> }
    ],
  },
  {
    title: "Configurações",
    permissionKey: "configurarSistema",
    links: [
      { to: "/configuracoes", label: "Backup e Gateway", permission: "configurarSistema", icon: <Settings size={18} /> }
    ],
  },
  {
    title: "Ordens de Serviço",
    permissionKey: "visualizarRelatorios",
    links: [
      { to: "/ordens/melhoria", label: "Solicitações de Melhoria", permission: "visualizarRelatorios", icon: <ClipboardList size={18} /> },
      { to: "/ordens/ajuste", label: "Solicitações de Ajuste", permission: "visualizarRelatorios", icon: <ClipboardList size={18} /> },
      { to: "/ordens/suporte", label: "Pedidos de Suporte", permission: "visualizarRelatorios", icon: <ClipboardList size={18} /> },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // mobile menu open/close
  const [openModules, setOpenModules] = useState({}); // modules accordion state
  const { user } = useAuth();

  function toggleModule(title) {
    setOpenModules((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }

  return (
    <>
      {/* Botão hamburger mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-[9999] p-2 bg-gray-900 rounded-md text-white shadow"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar menu clicando fora (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[998]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 pt-20 pb-20 overflow-y-auto
          z-40 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex md:flex-col md:h-screen`}
      >
        {/* Link direto para dashboard */}
        {user?.permissoes?.acessarDashboard && (
          <nav className="mb-6 px-4">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-lg font-semibold
              ${
                location.pathname === "/dashboard"
                  ? "bg-green-500 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Home size={20} />
              Dashboard
            </Link>
          </nav>
        )}

        {/* Demais módulos */}
        {modules.map(({ title, links }) => {
          // Esconde módulo se nenhuma permissão
          const hasPermission = links.some(link => user?.permissoes?.[link.permission]);
          if (!hasPermission) return null;

          const isModuleOpen = openModules[title] || false;

          return (
            <nav key={title} className="mb-4">
              <button
                onClick={() => toggleModule(title)}
                className="flex justify-between items-center w-full px-4 py-2 text-sm font-semibold uppercase text-gray-400 hover:text-white hover:bg-gray-700 rounded-md focus:outline-none"
              >
                <span>{title}</span>
                {isModuleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isModuleOpen && (
                <ul className="mt-2 space-y-1">
                  {links.map(({ to, label, icon, permission }) => {
                    if (!user?.permissoes?.[permission]) return null;
                    const isActive = location.pathname === to;
                    return (
                      <li key={to}>
                        <Link
                          to={to}
                          className={`flex items-center gap-3 px-6 py-2 rounded-md transition-colors
                          ${
                            isActive
                              ? "bg-green-500 text-white"
                              : "hover:bg-gray-700 text-gray-300"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          {icon}
                          <span>{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          );
        })}
      </aside>
    </>
  );
}
