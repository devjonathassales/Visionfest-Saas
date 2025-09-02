// src/layout/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom"; // << IMPORTANTE
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-white text-black min-h-screen">
      <Navbar onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 overflow-y-auto font-opensans">
          <Outlet /> {/* << RENDERIZA AS ROTAS FILHAS */}
        </main>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
