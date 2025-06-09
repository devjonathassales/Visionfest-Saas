import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ClientForm from './pages/ClientForm';
import ClientList from './pages/ClientList';
import ClientView from './pages/ClientView';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout><Home /></DashboardLayout>} />
        <Route path="/cadastros" element={<DashboardLayout><ClientForm /></DashboardLayout>} />
        <Route path="/cadastros" element={<DashboardLayout><ClientList /></DashboardLayout>} />
        <Route path="/cadastros/cliente/:id" element={<DashboardLayout><ClientView /></DashboardLayout>} />
        {/* Aqui futuramente: estoque, financeiro, etc. */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
