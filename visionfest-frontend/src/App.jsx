// src/App.jsx
import React, { useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "/src/contexts/authContext.jsx";
import { useAuth } from "/src/contexts/authContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginCliente from "./pages/LoginCliente";

import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";

// Cadastros
import Clientes from "./pages/Cadastros/Clientes";
import Fornecedores from "./pages/Cadastros/Fornecedores";
import Funcionarios from "./pages/Cadastros/Funcionarios";
import Produtos from "./pages/Cadastros/Produtos";

// Outros
import Estoque from "./pages/Estoque";
import Contratos from "./pages/Contratos";
import Agenda from "./pages/Agenda";
import Crm from "./pages/Crm";

// Financeiro
import Caixa from "./pages/Financeiro/Caixa";
import ContasPagar from "./pages/Financeiro/ContasPagar";
import ContasReceber from "./pages/Financeiro/ContasReceber";
import ContasBancarias from "./pages/Financeiro/ContasBancarias";
import CartoesCredito from "./pages/Financeiro/CartoesCredito";
import CentroCusto from "./pages/Financeiro/CentroCusto";

// Relatórios
import ClientesRelatorio from "./pages/Relatorios/ClientesRelatorio";
import ContratosRelatorio from "./pages/Relatorios/ContratosRelatorio";
import AgendaRelatorio from "./pages/Relatorios/AgendaRelatorio";
import FluxoCaixa from "./pages/Relatorios/FluxoCaixa";
import FinanceiroRelatorio from "./pages/Relatorios/FinanceiroRelatorio";
import EstoqueRelatorio from "./pages/Relatorios/EstoqueRelatorio";

// Configurações
import Empresa from "./pages/Configuracoes/Empresa";
import Usuarios from "./pages/Configuracoes/Usuarios";
import Permissoes from "./pages/Configuracoes/Permissoes";
import Faturas from "./pages/Configuracoes/Faturas";
import Contrato from "./pages/Configuracoes/Contrato";
import Suporte from "./pages/Configuracoes/Suporte";

/** Descobre um basename quando a app estiver hospedada em /cliente_<tenant>/... */
function getBasename() {
  try {
    const seg1 = window.location.pathname.split("/").filter(Boolean)[0] || "";
    if (/^cliente[_-][a-z0-9-]+$/i.test(seg1)) return `/${seg1}`;
  } catch {}
  return "/";
}

/** Redireciona a rota raiz conforme a autenticação */
function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

/** Bloqueia /login se já autenticado */
function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const basename = useMemo(getBasename, []);

  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          {/* Raiz decide para onde ir */}
          <Route index element={<RootRedirect />} />

          {/* 🔓 pública */}
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginCliente />
              </PublicOnly>
            }
          />

          {/* 🔐 protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Cadastros */}
              <Route path="/cadastros/clientes" element={<Clientes />} />
              <Route
                path="/cadastros/fornecedores"
                element={<Fornecedores />}
              />
              <Route
                path="/cadastros/funcionarios"
                element={<Funcionarios />}
              />
              <Route path="/cadastros/produtos" element={<Produtos />} />

              {/* Outros */}
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/crm" element={<Crm />} />

              {/* Financeiro */}
              <Route path="/financeiro/caixa" element={<Caixa />} />
              <Route path="/financeiro/pagar" element={<ContasPagar />} />
              <Route path="/financeiro/receber" element={<ContasReceber />} />
              <Route
                path="/financeiro/contas-bancarias"
                element={<ContasBancarias />}
              />
              <Route path="/financeiro/cartoes" element={<CartoesCredito />} />
              <Route
                path="/financeiro/centro-custo"
                element={<CentroCusto />}
              />

              {/* Relatórios */}
              <Route
                path="/relatorios/clientes"
                element={<ClientesRelatorio />}
              />
              <Route
                path="/relatorios/contratos"
                element={<ContratosRelatorio />}
              />
              <Route path="/relatorios/agenda" element={<AgendaRelatorio />} />
              <Route path="/relatorios/fluxo-caixa" element={<FluxoCaixa />} />
              <Route
                path="/relatorios/financeiro"
                element={<FinanceiroRelatorio />}
              />
              <Route
                path="/relatorios/estoque"
                element={<EstoqueRelatorio />}
              />

              {/* Configurações */}
              <Route path="/configuracoes/empresa" element={<Empresa />} />
              <Route path="/configuracoes/usuarios" element={<Usuarios />} />
              <Route
                path="/configuracoes/permissoes"
                element={<Permissoes />}
              />
              <Route path="/configuracoes/faturas" element={<Faturas />} />
              <Route path="/configuracoes/contrato" element={<Contrato />} />
              <Route path="/configuracoes/suporte" element={<Suporte />} />
            </Route>
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}
