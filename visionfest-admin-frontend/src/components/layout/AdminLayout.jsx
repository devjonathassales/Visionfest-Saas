import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer"; // Importa o Footer (ajuste o caminho se necessário)

export default function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="p-6 flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
