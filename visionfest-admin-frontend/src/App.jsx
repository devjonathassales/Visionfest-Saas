import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./components/layout/AdminLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import AuthGuard from "./components/AuthGuard"; // ✅ Guardião

// Páginas públicas
import LoginPage from "./pages/LoginPage";
import CadastroSaaSPage from "./pages/CadastroSaaSPage";

// Páginas privadas
import DashboardPage from "./pages/DashboardPage";
import EmpresasPage from "./pages/Cadastros/EmpresasPage";
import PlanosPage from "./pages/Cadastros/PlanosPage";
import UsuariosPage from "./pages/Cadastros/UsuariosPage";

import ContasPagarPage from "./pages/Financeiro/ContasPagarPage";
import ContasReceberPage from "./pages/Financeiro/ContasReceberPage";
import CentroCustoPage from "./pages/Financeiro/CentroCustoPage";
import CaixaPage from "./pages/Financeiro/CaixaPage";
import ContasBancariasPage from "./pages/Financeiro/ContasBancariasPage";

import RelatoriosGeraisPage from "./pages/Relatorios/RelatoriosGeraisPage";
import BackupEGatewayPage from "./pages/Configuracoes/BackupEGatewayPage";

import MelhoriaPage from "./pages/OrdensServico/MelhoriaPage";
import AjustePage from "./pages/OrdensServico/AjustePage";
import SuportePage from "./pages/OrdensServico/SuportePage";

// ✅ Bloqueia /login e /cadastro para usuários logados
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
        <Routes>
          {/* 🔓 Rotas públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <PublicRoute>
                <CadastroSaaSPage />
              </PublicRoute>
            }
          />

          {/* 🔐 Rotas privadas com layout */}
          <Route
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Cadastros */}
            <Route path="/cadastros/empresas" element={<EmpresasPage />} />
            <Route path="/cadastros/planos" element={<PlanosPage />} />
            <Route path="/cadastros/usuarios" element={<UsuariosPage />} />

            {/* Financeiro */}
            <Route
              path="/financeiro/contas-pagar"
              element={<ContasPagarPage />}
            />
            <Route
              path="/financeiro/contas-receber"
              element={<ContasReceberPage />}
            />
            <Route
              path="/financeiro/centro-custo"
              element={<CentroCustoPage />}
            />
            <Route path="/financeiro/caixa" element={<CaixaPage />} />
            <Route
              path="/financeiro/contas-bancarias"
              element={<ContasBancariasPage />}
            />

            {/* Relatórios */}
            <Route path="/relatorios" element={<RelatoriosGeraisPage />} />

            {/* Configurações */}
            <Route path="/configuracoes" element={<BackupEGatewayPage />} />

            {/* Ordens de Serviço */}
            <Route path="/ordens/melhoria" element={<MelhoriaPage />} />
            <Route path="/ordens/ajuste" element={<AjustePage />} />
            <Route path="/ordens/suporte" element={<SuportePage />} />
          </Route>

          {/* 🔄 Catch-all → redireciona para dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
