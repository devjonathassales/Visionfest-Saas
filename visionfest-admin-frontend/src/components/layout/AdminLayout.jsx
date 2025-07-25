import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Home, Settings, Users, FileText, DollarSign, Box } from "lucide-react";

export default function AdminLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Helper para verificar se o usuário tem permissão
  const can = (permissao) => {
    if (user?.role === "superadmin") return true; // Superadmin vê tudo
    return user?.permissoes?.[permissao];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-500 text-lg">Carregando painel...</div>
      </div>
    );
  }

  if (!user) {
    // Caso raro: token expirado ou inválido
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-red-500 text-lg">Sessão expirada. Faça login novamente.</div>
        <button
          onClick={handleLogout}
          className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-center text-2xl font-bold border-b border-gray-700">
          VisionFest
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 hover:bg-gray-700 ${
                    isActive ? "bg-gray-700 font-semibold" : ""
                  }`
                }
              >
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </NavLink>
            </li>

            {/* Cadastros */}
            {can("configurarSistema") && (
              <>
                <li className="px-4 py-2 text-gray-400 uppercase text-xs">Cadastros</li>
                <li>
                  <NavLink
                    to="/cadastros/empresas"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 hover:bg-gray-700 ${
                        isActive ? "bg-gray-700 font-semibold" : ""
                      }`
                    }
                  >
                    <Box className="w-5 h-5 mr-2" />
                    Empresas
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/cadastros/planos"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 hover:bg-gray-700 ${
                        isActive ? "bg-gray-700 font-semibold" : ""
                      }`
                    }
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Planos
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/cadastros/usuarios"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 hover:bg-gray-700 ${
                        isActive ? "bg-gray-700 font-semibold" : ""
                      }`
                    }
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Usuários
                  </NavLink>
                </li>
              </>
            )}

            {/* Financeiro */}
            {can("visualizarFinanceiro") && (
              <>
                <li className="px-4 py-2 text-gray-400 uppercase text-xs">Financeiro</li>
                <li>
                  <NavLink
                    to="/financeiro/contas-pagar"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 hover:bg-gray-700 ${
                        isActive ? "bg-gray-700 font-semibold" : ""
                      }`
                    }
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Contas a Pagar
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/financeiro/contas-receber"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 hover:bg-gray-700 ${
                        isActive ? "bg-gray-700 font-semibold" : ""
                      }`
                    }
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Contas a Receber
                  </NavLink>
                </li>
              </>
            )}

            {/* Relatórios */}
            {can("visualizarRelatorios") && (
              <li>
                <NavLink
                  to="/relatorios"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 hover:bg-gray-700 ${
                      isActive ? "bg-gray-700 font-semibold" : ""
                    }`
                  }
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Relatórios
                </NavLink>
              </li>
            )}

            {/* Configurações */}
            {can("configurarSistema") && (
              <li>
                <NavLink
                  to="/configuracoes"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 hover:bg-gray-700 ${
                      isActive ? "bg-gray-700 font-semibold" : ""
                    }`
                  }
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <span className="text-sm">{user?.nome || "Usuário"}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-400 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
