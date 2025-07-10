import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./components/layout/AdminLayout";

// Páginas já criadas
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

import LoginPage from "./pages/LoginPage";
import CadastroSaaSPage from "./pages/CadastroSaaSPage"; // <-- importado aqui

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroSaaSPage />} /> {/* <-- nova rota */}

        {/* Redireciona root para dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rotas protegidas com layout administrativo */}
        <Route element={<AdminLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Cadastros */}
          <Route path="/cadastros/empresas" element={<EmpresasPage />} />
          <Route path="/cadastros/planos" element={<PlanosPage />} />
          <Route path="/cadastros/usuarios" element={<UsuariosPage />} />

          {/* Financeiro */}
          <Route path="/financeiro/contas-pagar" element={<ContasPagarPage />} />
          <Route path="/financeiro/contas-receber" element={<ContasReceberPage />} />
          <Route path="/financeiro/centro-custo" element={<CentroCustoPage />} />
          <Route path="/financeiro/caixa" element={<CaixaPage />} />
          <Route path="/financeiro/contas-bancarias" element={<ContasBancariasPage />} />

          {/* Relatórios */}
          <Route path="/relatorios" element={<RelatoriosGeraisPage />} />

          {/* Configurações */}
          <Route path="/configuracoes" element={<BackupEGatewayPage />} />

          {/* Ordens de Serviço */}
          <Route path="/ordens/melhoria" element={<MelhoriaPage />} />
          <Route path="/ordens/ajuste" element={<AjustePage />} />
          <Route path="/ordens/suporte" element={<SuportePage />} />
        </Route>

        {/* Rota catch-all: redireciona para dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
