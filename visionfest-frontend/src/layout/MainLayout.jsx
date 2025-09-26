// src/layout/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-white text-black min-h-screen">
      <Navbar onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

      {/* Conteúdo fica sob a navbar */}
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Área principal rola independentemente */}
        <main className="flex-1 p-4 overflow-y-auto font-opensans min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
