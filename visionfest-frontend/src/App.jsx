// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";

// Auth
import { AuthProvider } from "/src/contexts/authContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginCliente from "./pages/LoginCliente";

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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota pública: login */}
          <Route path="/login" element={<LoginCliente />} />

          {/* Rotas protegidas: tudo dentro do MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
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

              <Route path="/estoque" element={<Estoque />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/crm" element={<Crm />} />

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

              <Route path="/configuracoes/empresa" element={<Empresa />} />
              <Route path="/configuracoes/usuarios" element={<Usuarios />} />
              <Route
                path="/configuracoes/permissoes"
                element={<Permissoes />}
              />
              <Route path="/configuracoes/faturas" element={<Faturas />} />
              <Route path="/configuracoes/contrato" element={<Contrato />} />
            </Route>
          </Route>
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}
